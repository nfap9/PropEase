"""
UtilityConfig repository for data access operations.
"""

from sqlalchemy.orm import Session

from app.models.utility_config import UtilityConfig
from app.repositories.base import BaseRepository


class UtilityConfigRepository(BaseRepository[UtilityConfig]):
    """Repository for UtilityConfig model."""

    def __init__(self, db: Session):
        super().__init__(db, UtilityConfig)

    def find_by_apartment(self, apartment_id: str) -> UtilityConfig | None:
        """Find utility config by apartment ID."""
        return self.db.query(UtilityConfig).filter(UtilityConfig.apartment_id == apartment_id).first()

    def upsert(
        self,
        apartment_id: str,
        water_price_per_unit: float | None = None,
        electricity_price_per_unit: float | None = None,
        internet_fee: float | None = None,
        management_fee: float | None = None,
        service_fee: float | None = None,
        effective_from=None,
        notes: str | None = None,
    ) -> UtilityConfig:
        """
        Create or update utility config for an apartment.
        If config exists, update it; otherwise create a new one.
        """
        config = self.find_by_apartment(apartment_id)
        if config:
            # Update existing config
            if water_price_per_unit is not None:
                config.water_price_per_unit = water_price_per_unit
            if electricity_price_per_unit is not None:
                config.electricity_price_per_unit = electricity_price_per_unit
            if internet_fee is not None:
                config.internet_fee = internet_fee
            if management_fee is not None:
                config.management_fee = management_fee
            if service_fee is not None:
                config.service_fee = service_fee
            if effective_from is not None:
                config.effective_from = effective_from
            if notes is not None:
                config.notes = notes
            self.db.commit()
            self.db.refresh(config)
            return config
        else:
            # Create new config
            new_config = UtilityConfig(
                apartment_id=apartment_id,
                water_price_per_unit=water_price_per_unit,
                electricity_price_per_unit=electricity_price_per_unit,
                internet_fee=internet_fee,
                management_fee=management_fee,
                service_fee=service_fee,
                effective_from=effective_from,
                notes=notes,
            )
            return self.create(new_config)
