"""
SMS verification code repository for data access operations.
"""

from datetime import UTC, datetime, timedelta

from sqlalchemy.orm import Session

from app.models.sms_verification_code import SmsVerificationCode
from app.repositories.base import BaseRepository


class SmsVerificationCodeRepository(BaseRepository[SmsVerificationCode]):
    """Repository for SmsVerificationCode model."""

    def __init__(self, db: Session):
        super().__init__(db, SmsVerificationCode)

    def find_valid_code(self, phone: str, code: str, purpose: str) -> SmsVerificationCode | None:
        """Find a valid (unused and not expired) verification code."""
        return (
            self.db.query(SmsVerificationCode)
            .filter(
                SmsVerificationCode.phone == phone,
                SmsVerificationCode.code == code,
                SmsVerificationCode.purpose == purpose,
                SmsVerificationCode.is_used == False,
                SmsVerificationCode.expires_at > datetime.now(UTC),
            )
            .first()
        )

    def has_recent_code(self, phone: str, purpose: str, seconds: int = 60) -> bool:
        """Check if a code was sent recently within the specified seconds."""
        threshold = datetime.now(UTC) - timedelta(seconds=seconds)
        return (
            self.db.query(SmsVerificationCode)
            .filter(
                SmsVerificationCode.phone == phone,
                SmsVerificationCode.purpose == purpose,
                SmsVerificationCode.created_at > threshold,
            )
            .first()
            is not None
        )

    def count_today_codes(self, phone: str) -> int:
        """Count codes sent today for a phone number."""
        today_start = datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0)
        return (
            self.db.query(SmsVerificationCode)
            .filter(
                SmsVerificationCode.phone == phone,
                SmsVerificationCode.created_at >= today_start,
            )
            .count()
        )

    def mark_used(self, record: SmsVerificationCode) -> None:
        """Mark a verification code as used."""
        record.is_used = True
        self.db.commit()

    def create_code(self, phone: str, code: str, purpose: str, expires_at: datetime) -> SmsVerificationCode:
        """Create a new verification code record."""
        record = SmsVerificationCode(phone=phone, code=code, purpose=purpose, expires_at=expires_at)
        return self.create(record)
