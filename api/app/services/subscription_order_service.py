"""
Subscription order service: create payment orders and fulfill subscriptions on payment success.
"""

import json
import logging
from datetime import UTC, date, datetime, timedelta

from sqlalchemy.orm import Session

from app.configs.settings import settings
from app.models.subscription import (
    BillingCycle,
    SubscriptionOrder,
    SubscriptionOrderPaymentMethod,
    SubscriptionOrderStatus,
    SubscriptionStatus,
)
from app.repositories.organization_repository import OrganizationRepository
from app.repositories.subscription_order_repository import SubscriptionOrderRepository
from app.repositories.subscription_repository import (
    OrganizationSubscriptionRepository,
    SubscriptionPlanRepository,
)
from app.schemas.subscription import ChangePlanRequest, SubscribeRequest
from app.services.base import BaseService
from app.services.subscription_service import SubscriptionService

logger = logging.getLogger(__name__)

# 订单号前缀，便于识别；微信 out_trade_no 最长 32 位
ORDER_NO_PREFIX = "SUB"
ORDER_EXPIRE_MINUTES = 30


def _order_no() -> str:
    """生成商户订单号（供微信 out_trade_no 使用）。"""
    from ulid import ulid

    return f"{ORDER_NO_PREFIX}{ulid()}"[:32]


def _load_private_key() -> str:
    """从配置加载商户私钥。"""
    if settings.WECHAT_PRIVATE_KEY_PATH:
        with open(settings.WECHAT_PRIVATE_KEY_PATH, encoding="utf-8") as f:
            return f.read()
    return settings.WECHAT_PRIVATE_KEY or ""


class SubscriptionOrderService(BaseService):
    """Service for subscription payment orders and payment callback handling."""

    def __init__(self, db: Session):
        super().__init__(db)
        self.order_repo = SubscriptionOrderRepository(db)
        self.plan_repo = SubscriptionPlanRepository(db)
        self.subscription_repo = OrganizationSubscriptionRepository(db)
        self.org_repo = OrganizationRepository(db)
        self._subscription_service = SubscriptionService(db)

    def create_order(
        self,
        organization_id: str,
        plan_id: str,
        billing_cycle: str = BillingCycle.MONTHLY.value,
    ) -> SubscriptionOrder:
        """
        创建订阅支付订单，并调用微信 Native 下单（若已配置）。
        免费套餐不应调用此方法，应由前端直接调用 subscribe。
        """
        org = self.org_repo.get(organization_id)
        if not org:
            raise ValueError("组织不存在")

        plan = self.plan_repo.get(plan_id)
        if not plan:
            raise ValueError("订阅套餐不存在")

        if plan.price_monthly <= 0 and plan.price_yearly <= 0:
            raise ValueError("免费套餐请直接订阅，无需创建支付订单")

        if billing_cycle == BillingCycle.YEARLY.value:
            amount = float(plan.price_yearly)
        else:
            amount = float(plan.price_monthly)

        if amount <= 0:
            raise ValueError("该套餐在当前计费周期下无需支付")

        now = datetime.now(UTC)
        expires_at = now + timedelta(minutes=ORDER_EXPIRE_MINUTES)
        order_no = _order_no()

        order = SubscriptionOrder(
            order_no=order_no,
            organization_id=organization_id,
            plan_id=plan_id,
            billing_cycle=BillingCycle.MONTHLY if billing_cycle == "monthly" else BillingCycle.YEARLY,
            amount=amount,
            currency="CNY",
            status=SubscriptionOrderStatus.PENDING,
            payment_method=SubscriptionOrderPaymentMethod.WECHAT_NATIVE,
            code_url=None,
            expires_at=expires_at,
        )
        order = self.order_repo.create(order)

        if settings.WECHAT_PAY_ENABLED and all(
            [
                settings.WECHAT_MCH_ID,
                settings.WECHAT_APIV3_KEY,
                settings.WECHAT_APP_ID,
                settings.WECHAT_CERT_SERIAL_NO,
                settings.WECHAT_PAY_NOTIFY_URL_BASE,
            ]
        ):
            private_key = _load_private_key()
            if not private_key:
                logger.warning("微信支付已开启但未配置商户私钥，订单将无 code_url")
            else:
                try:
                    code_url = self._wechat_native_pay(
                        order_no=order_no,
                        description=f"订阅-{plan.name}-{billing_cycle}",
                        amount_fen=int(round(amount * 100)),
                    )
                    if code_url:
                        order.code_url = code_url
                        self.db.commit()
                        self.db.refresh(order)
                except Exception as e:
                    logger.exception("微信 Native 下单失败: %s", e)
                    raise ValueError("发起支付失败，请稍后重试") from e
        else:
            # 未配置支付时仍返回订单，前端可提示“支付未配置”
            order.code_url = None
            self.db.commit()
            self.db.refresh(order)

        return order

    def _wechat_native_pay(self, order_no: str, description: str, amount_fen: int) -> str | None:
        """调用微信 Native 下单，返回 code_url。"""
        try:
            from wechatpayv3 import WeChatPay, WeChatPayType
        except ImportError:
            logger.warning("未安装 wechatpayv3，无法发起微信支付")
            return None

        notify_url = f"{settings.WECHAT_PAY_NOTIFY_URL_BASE.rstrip('/')}{settings.API_V1_PREFIX}/webhooks/wechat-pay"
        private_key = _load_private_key()
        wxpay = WeChatPay(
            wechatpay_type=WeChatPayType.NATIVE,
            mchid=settings.WECHAT_MCH_ID,
            private_key=private_key,
            cert_serial_no=settings.WECHAT_CERT_SERIAL_NO,
            apiv3_key=settings.WECHAT_APIV3_KEY,
            appid=settings.WECHAT_APP_ID,
            notify_url=notify_url,
            cert_dir=None,
            logger=logger,
        )
        code, message = wxpay.pay(
            description=description,
            out_trade_no=order_no,
            amount={"total": amount_fen},
            pay_type=WeChatPayType.NATIVE,
        )
        if code != 200:
            raise ValueError(f"微信下单返回 {code}: {message}")
        data = json.loads(message) if isinstance(message, str) else message
        return data.get("code_url")

    def get_order_for_org(self, organization_id: str, order_id: str) -> SubscriptionOrder | None:
        """获取组织的某笔订单（用于前端轮询）。"""
        order = self.order_repo.get(order_id)
        if not order or order.organization_id != organization_id:
            return None
        return order

    def handle_wechat_pay_callback(self, body: bytes, headers: dict) -> tuple[int, dict] | None:
        """
        处理微信支付结果通知。验签并解密后，根据 out_trade_no 更新订单并履行订阅。
        返回 (http_status, response_body) 供控制器直接返回；验签/解密失败返回 None。
        """
        if not settings.WECHAT_PAY_ENABLED:
            return 500, {"code": "FAIL", "message": "支付未启用"}

        try:
            from wechatpayv3 import WeChatPay, WeChatPayType
        except ImportError:
            logger.warning("未安装 wechatpayv3，无法处理回调")
            return 500, {"code": "FAIL", "message": "SDK not available"}

        notify_url = f"{settings.WECHAT_PAY_NOTIFY_URL_BASE.rstrip('/')}{settings.API_V1_PREFIX}/webhooks/wechat-pay"
        private_key = _load_private_key()
        wxpay = WeChatPay(
            wechatpay_type=WeChatPayType.NATIVE,
            mchid=settings.WECHAT_MCH_ID,
            private_key=private_key,
            cert_serial_no=settings.WECHAT_CERT_SERIAL_NO,
            apiv3_key=settings.WECHAT_APIV3_KEY,
            appid=settings.WECHAT_APP_ID,
            notify_url=notify_url,
            cert_dir=None,
            logger=logger,
        )
        # 回调验签与解密：不同版本 SDK 接口可能为 callback 或 parse_callback
        decrypted = None
        if hasattr(wxpay, "callback"):
            decrypted = wxpay.callback(body, headers)
        elif hasattr(wxpay, "parse_callback"):
            decrypted = wxpay.parse_callback(body, headers)

        if not decrypted or not isinstance(decrypted, dict):
            return None

        event_type = decrypted.get("event_type")
        if event_type != "TRANSACTION.SUCCESS":
            return 200, {"code": "SUCCESS", "message": "ignored"}

        resource = decrypted.get("resource") or {}
        out_trade_no = resource.get("out_trade_no")
        transaction_id = resource.get("transaction_id")
        if not out_trade_no:
            return 200, {"code": "FAIL", "message": "missing out_trade_no"}

        order = self.order_repo.find_by_order_no(out_trade_no)
        if not order:
            logger.warning("微信回调订单不存在: out_trade_no=%s", out_trade_no)
            return 200, {"code": "SUCCESS", "message": "ok"}

        if order.status == SubscriptionOrderStatus.PAID:
            return 200, {"code": "SUCCESS", "message": "already paid"}

        now = datetime.now(UTC)
        order.status = SubscriptionOrderStatus.PAID
        order.wechat_transaction_id = transaction_id
        order.paid_at = now
        self.db.commit()
        self.db.refresh(order)

        try:
            self._fulfill_subscription(order)
        except Exception as e:
            logger.exception("履行订阅失败 order_id=%s: %s", order.id, e)
            # 订单已标记为已付，避免微信重复回调；业务可后续人工处理
        return 200, {"code": "SUCCESS", "message": "ok"}

    def _fulfill_subscription(self, order: SubscriptionOrder) -> None:
        """根据已支付订单开通/续费/升级组织订阅。"""
        org_id = order.organization_id
        plan_id = order.plan_id
        billing_cycle = order.billing_cycle.value if hasattr(order.billing_cycle, "value") else order.billing_cycle
        plan = self.plan_repo.get(plan_id)
        if not plan:
            raise ValueError("套餐不存在")

        subscription = self.subscription_repo.find_by_organization(org_id)
        today = date.today()
        active = (
            subscription
            and subscription.status == SubscriptionStatus.ACTIVE
            and (subscription.end_date is None or subscription.end_date >= today)
        )

        if not active or not subscription:
            # 新购或已过期：直接开通
            self._subscription_service.subscribe(
                org_id,
                SubscribeRequest(plan_id=plan_id, billing_cycle=billing_cycle, auto_renew=True),
            )
        elif subscription.plan_id == plan_id:
            # 续费：延长当前订阅 end_date
            if subscription.end_date and subscription.end_date >= today:
                base_date = subscription.end_date
            else:
                base_date = today
            if billing_cycle == BillingCycle.YEARLY.value:
                new_end = base_date + timedelta(days=365)
            else:
                new_end = base_date + timedelta(days=30)
            self.subscription_repo.create_or_update(
                org_id=org_id,
                plan_id=plan_id,
                status=SubscriptionStatus.ACTIVE,
                billing_cycle=billing_cycle,
                start_date=subscription.start_date,
                end_date=new_end,
                auto_renew=subscription.auto_renew,
            )
            org = self.org_repo.get(org_id)
            if org:
                self.org_repo.update(org_id, plan=plan.code)
        else:
            # 升级：换套餐
            self._subscription_service.change_plan(
                org_id,
                ChangePlanRequest(plan_id=plan_id, billing_cycle=billing_cycle),
            )

        # 可选：回写订单关联的订阅 ID 便于追溯
        sub = self.subscription_repo.find_by_organization(org_id)
        if sub:
            order.organization_subscription_id = sub.id
            self.db.commit()
