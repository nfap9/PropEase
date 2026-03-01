"""
WeChat Pay notification webhook - no auth, verify by WeChat signature.
"""

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from app.configs.database import SessionLocal
from app.services.subscription_order_service import SubscriptionOrderService

router = APIRouter()


@router.post("")
async def wechat_pay_notify(request: Request) -> JSONResponse:
    """
    微信支付结果通知。需配置 WECHAT_PAY_NOTIFY_URL_BASE 为可公网访问的 base URL，
    完整回调地址为 {WECHAT_PAY_NOTIFY_URL_BASE}/api/v1/webhooks/wechat-pay。
    """
    body = await request.body()
    headers = dict(request.headers) if request.headers else {}
    db = SessionLocal()
    try:
        service = SubscriptionOrderService(db)
        result = service.handle_wechat_pay_callback(body, headers)
        if result is None:
            return JSONResponse(status_code=500, content={"code": "FAIL", "message": "验签或解密失败"})
        status_code, content = result
        return JSONResponse(status_code=status_code, content=content)
    finally:
        db.close()
