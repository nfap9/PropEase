"""
SMS service for sending and verifying verification codes.
"""

import logging
import random
from datetime import UTC, datetime, timedelta
from typing import Protocol

from sqlalchemy.orm import Session

from app.configs.settings import settings
from app.repositories.sms_verification_code_repository import SmsVerificationCodeRepository

logger = logging.getLogger(__name__)


class SmsProvider(Protocol):
    """短信服务商接口协议"""

    def send_verification_code(self, phone: str, code: str) -> bool:
        """发送验证码到指定手机号"""
        ...


class MockSmsProvider:
    """模拟短信服务（开发测试用）"""

    def send_verification_code(self, phone: str, code: str) -> bool:
        """模拟发送验证码，实际打印到日志"""
        logger.info(f"[Mock SMS] 发送验证码 {code} 到手机 {phone}")
        print(f"[Mock SMS] 验证码: {code} -> 手机: {phone}")
        return True


class AliyunSmsProvider:
    """阿里云短信服务"""

    def __init__(
        self,
        access_key: str,
        secret: str,
        sign_name: str,
        template_code: str,
    ):
        self.access_key = access_key
        self.secret = secret
        self.sign_name = sign_name
        self.template_code = template_code

    def send_verification_code(self, phone: str, code: str) -> bool:
        """通过阿里云发送验证码"""
        try:
            # TODO: 实现阿里云短信 API 调用
            # from aliyunsdkcore.client import AcsClient
            # from aliyunsdkcore.acs_exception.exceptions import ServerException
            # from aliyunsdkdysmsapi.request.v20170525 import SendSmsRequest
            logger.info(f"[Aliyun SMS] 发送验证码到 {phone}")
            return True
        except Exception as e:
            logger.error(f"[Aliyun SMS] 发送失败: {e}")
            return False


class TencentSmsProvider:
    """腾讯云短信服务"""

    def __init__(
        self,
        access_key: str,
        secret: str,
        sign_name: str,
        template_code: str,
    ):
        self.access_key = access_key
        self.secret = secret
        self.sign_name = sign_name
        self.template_code = template_code

    def send_verification_code(self, phone: str, code: str) -> bool:
        """通过腾讯云发送验证码"""
        try:
            # TODO: 实现腾讯云短信 API 调用
            logger.info(f"[Tencent SMS] 发送验证码到 {phone}")
            return True
        except Exception as e:
            logger.error(f"[Tencent SMS] 发送失败: {e}")
            return False


def get_sms_provider() -> SmsProvider:
    """根据配置获取短信服务提供商"""
    provider = settings.SMS_PROVIDER

    if provider == "mock" or not provider:
        return MockSmsProvider()
    elif provider == "aliyun":
        return AliyunSmsProvider(
            access_key=settings.SMS_ACCESS_KEY,
            secret=settings.SMS_SECRET,
            sign_name=settings.SMS_SIGN_NAME,
            template_code=settings.SMS_TEMPLATE_CODE,
        )
    elif provider == "tencent":
        return TencentSmsProvider(
            access_key=settings.SMS_ACCESS_KEY,
            secret=settings.SMS_SECRET,
            sign_name=settings.SMS_SIGN_NAME,
            template_code=settings.SMS_TEMPLATE_CODE,
        )
    else:
        logger.warning(f"未知的短信服务提供商: {provider}，使用 Mock")
        return MockSmsProvider()


class SmsService:
    """短信验证码服务"""

    def __init__(self, db: Session, provider: SmsProvider | None = None):
        self.db = db
        self.provider = provider or get_sms_provider()
        self.code_repo = SmsVerificationCodeRepository(db)

    def send_code(self, phone: str, purpose: str) -> bool:
        """
        发送验证码

        Args:
            phone: 手机号
            purpose: 用途 ('login' 或 'register')

        Returns:
            bool: 是否发送成功

        Raises:
            ValueError: 如果发送过于频繁或超过每日限制
        """
        # 1. 检查发送频率限制
        if self.code_repo.has_recent_code(phone, purpose, seconds=settings.SMS_CODE_RESEND_SECONDS):
            raise ValueError(f"验证码发送过于频繁，请{settings.SMS_CODE_RESEND_SECONDS}秒后重试")

        # 2. 检查每日发送次数限制
        daily_count = self.code_repo.count_today_codes(phone)
        if daily_count >= settings.SMS_CODE_MAX_DAILY:
            raise ValueError("今日发送次数已达上限，请明天再试")

        # 3. 生成6位验证码
        code = self._generate_code()

        # 4. 计算过期时间
        expires_at = datetime.now(UTC) + timedelta(minutes=settings.SMS_CODE_EXPIRE_MINUTES)

        # 5. 保存验证码记录
        self.code_repo.create_code(phone, code, purpose, expires_at)

        # 6. 发送短信
        return self.provider.send_verification_code(phone, code)

    def verify_code(self, phone: str, code: str, purpose: str) -> bool:
        """
        验证验证码

        Args:
            phone: 手机号
            code: 验证码
            purpose: 用途 ('login' 或 'register')

        Returns:
            bool: 验证码是否有效
        """
        record = self.code_repo.find_valid_code(phone, code, purpose)
        if not record:
            return False

        # 标记为已使用
        self.code_repo.mark_used(record)
        return True

    def _generate_code(self) -> str:
        """生成6位数字验证码"""
        return str(random.randint(100000, 999999))
