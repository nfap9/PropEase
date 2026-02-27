from datetime import datetime
from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.configs.database import Base
from app.models.base import TimestampMixin, ULIDMixin


class SmsVerificationCode(Base, TimestampMixin, ULIDMixin):
    """短信验证码模型"""
    __tablename__ = "sms_verification_codes"

    phone: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    code: Mapped[str] = mapped_column(String(6), nullable=False)
    purpose: Mapped[str] = mapped_column(String(20), nullable=False)  # 'login', 'register'
    is_used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
