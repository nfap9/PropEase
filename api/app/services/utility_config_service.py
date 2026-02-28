"""
UtilityConfig service for utility pricing configuration management.
"""
from typing import Optional
from datetime import date
from sqlalchemy.orm import Session

from app.services.base import BaseService
from app.repositories.utility_config_repository import UtilityConfigRepository
from app.repositories.apartment_repository import ApartmentRepository
from app.models.utility_config import UtilityConfig
from app.schemas.utility_config import UtilityConfigCreate, UtilityConfigUpdate


class UtilityConfigService(BaseService):
    """Service for utility config management."""

    def __init__(self, db: Session):
        super().__init__(db)
        self.config_repo = UtilityConfigRepository(db)
        self.apartment_repo = ApartmentRepository(db)

    def get_config(self, apartment_id: str, org_id: str) -> Optional[UtilityConfig]:
        """
        Get utility config for an apartment.

        Args:
            apartment_id: Apartment ID
            org_id: Organization ID for access control

        Returns:
            UtilityConfig if found and apartment belongs to org, None otherwise
        """
        # Verify apartment belongs to organization
        apartment = self.apartment_repo.get(apartment_id)
        if not apartment or apartment.organization_id != org_id:
            return None

        return self.config_repo.find_by_apartment(apartment_id)

    def create_or_update_config(
        self,
        apartment_id: str,
        org_id: str,
        data: UtilityConfigCreate,
    ) -> Optional[UtilityConfig]:
        """
        Create or update utility config for an apartment.

        Args:
            apartment_id: Apartment ID
            org_id: Organization ID for access control
            data: Config data to create/update

        Returns:
            Created/updated UtilityConfig, or None if apartment not found
        """
        # Verify apartment belongs to organization
        apartment = self.apartment_repo.get(apartment_id)
        if not apartment or apartment.organization_id != org_id:
            return None

        return self.config_repo.upsert(
            apartment_id=apartment_id,
            water_price_per_unit=data.water_price_per_unit,
            electricity_price_per_unit=data.electricity_price_per_unit,
            internet_fee=data.internet_fee,
            management_fee=data.management_fee,
            service_fee=data.service_fee,
            effective_from=data.effective_from,
            notes=data.notes,
        )

    def update_config(
        self,
        apartment_id: str,
        org_id: str,
        data: UtilityConfigUpdate,
    ) -> Optional[UtilityConfig]:
        """
        Update existing utility config.

        Args:
            apartment_id: Apartment ID
            org_id: Organization ID for access control
            data: Config data to update

        Returns:
            Updated UtilityConfig, or None if not found
        """
        config = self.get_config(apartment_id, org_id)
        if not config:
            return None

        update_data = data.model_dump(exclude_unset=True)
        return self.config_repo.update(config.id, **update_data)

    def delete_config(self, apartment_id: str, org_id: str) -> bool:
        """
        Delete utility config for an apartment.

        Args:
            apartment_id: Apartment ID
            org_id: Organization ID for access control

        Returns:
            True if deleted, False if not found
        """
        config = self.get_config(apartment_id, org_id)
        if not config:
            return False

        return self.config_repo.delete(config.id)

    def get_effective_prices(
        self,
        apartment_id: str,
        org_id: str,
    ) -> dict:
        """
        Get effective utility prices for an apartment.
        Returns config prices or None if not configured.

        This method is useful for bill generation to get default prices.

        Args:
            apartment_id: Apartment ID
            org_id: Organization ID

        Returns:
            Dict with water_price, electricity_price, etc.
        """
        config = self.get_config(apartment_id, org_id)
        if not config:
            return {
                "water_price_per_unit": None,
                "electricity_price_per_unit": None,
                "internet_fee": None,
                "management_fee": None,
                "service_fee": None,
            }

        return {
            "water_price_per_unit": float(config.water_price_per_unit) if config.water_price_per_unit else None,
            "electricity_price_per_unit": float(config.electricity_price_per_unit) if config.electricity_price_per_unit else None,
            "internet_fee": float(config.internet_fee) if config.internet_fee else None,
            "management_fee": float(config.management_fee) if config.management_fee else None,
            "service_fee": float(config.service_fee) if config.service_fee else None,
        }
