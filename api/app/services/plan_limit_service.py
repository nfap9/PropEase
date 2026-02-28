"""
Plan limits service for checking organization usage limits.
"""
from typing import Dict, Optional
from sqlalchemy.orm import Session
from dataclasses import dataclass

from app.services.base import BaseService
from app.repositories.apartment_repository import ApartmentRepository, RoomRepository
from app.repositories.organization_repository import OrganizationMemberRepository


@dataclass
class PlanLimits:
    """Plan limits configuration."""
    max_apartments: int  # -1 means unlimited
    max_rooms: int  # -1 means unlimited
    max_members: int  # -1 means unlimited
    can_create_team: bool  # Whether user can create/invite team members


# Default plan limits configuration
PLAN_LIMITS: Dict[str, PlanLimits] = {
    "free": PlanLimits(
        max_apartments=1,
        max_rooms=100,
        max_members=1,  # Free users cannot invite others
        can_create_team=False,
    ),
    "pro": PlanLimits(
        max_apartments=5,
        max_rooms=500,
        max_members=5,
        can_create_team=True,
    ),
    "enterprise": PlanLimits(
        max_apartments=-1,  # Unlimited
        max_rooms=-1,  # Unlimited
        max_members=-1,  # Unlimited
        can_create_team=True,
    ),
}


class PlanLimitService(BaseService):
    """Service for checking organization plan limits."""

    def __init__(self, db: Session):
        super().__init__(db)
        self.apartment_repo = ApartmentRepository(db)
        self.room_repo = RoomRepository(db)
        self.member_repo = OrganizationMemberRepository(db)

    def get_plan_limits(self, plan: str) -> PlanLimits:
        """
        Get limits for a plan.

        Args:
            plan: Plan name (free/pro/enterprise)

        Returns:
            PlanLimits for the plan
        """
        return PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])

    def get_organization_usage(self, org_id: str) -> Dict[str, int]:
        """
        Get current usage for an organization.

        Args:
            org_id: Organization ID

        Returns:
            Dict with current usage counts
        """
        apartments = self.apartment_repo.find_by_organization(org_id)
        rooms = self.room_repo.find_by_organization(org_id)
        members = self.member_repo.find_by_organization(org_id)

        return {
            "apartments": len(apartments),
            "rooms": len(rooms),
            "members": len(members),
        }

    def can_create_apartment(self, org_id: str, plan: str) -> bool:
        """
        Check if organization can create a new apartment.

        Args:
            org_id: Organization ID
            plan: Current plan

        Returns:
            True if can create, False otherwise
        """
        limits = self.get_plan_limits(plan)
        if limits.max_apartments == -1:
            return True

        usage = self.get_organization_usage(org_id)
        return usage["apartments"] < limits.max_apartments

    def can_create_room(self, org_id: str, plan: str, count: int = 1) -> bool:
        """
        Check if organization can create new rooms.

        Args:
            org_id: Organization ID
            plan: Current plan
            count: Number of rooms to create

        Returns:
            True if can create, False otherwise
        """
        limits = self.get_plan_limits(plan)
        if limits.max_rooms == -1:
            return True

        usage = self.get_organization_usage(org_id)
        return usage["rooms"] + count <= limits.max_rooms

    def can_invite_member(self, org_id: str, plan: str) -> bool:
        """
        Check if organization can invite new members.

        Args:
            org_id: Organization ID
            plan: Current plan

        Returns:
            True if can invite, False otherwise
        """
        limits = self.get_plan_limits(plan)

        # Free users cannot invite anyone
        if not limits.can_create_team:
            return False

        if limits.max_members == -1:
            return True

        usage = self.get_organization_usage(org_id)
        return usage["members"] < limits.max_members

    def get_remaining_limits(self, org_id: str, plan: str) -> Dict[str, int]:
        """
        Get remaining limits for an organization.

        Args:
            org_id: Organization ID
            plan: Current plan

        Returns:
            Dict with remaining counts (-1 means unlimited)
        """
        limits = self.get_plan_limits(plan)
        usage = self.get_organization_usage(org_id)

        return {
            "apartments": (
                limits.max_apartments - usage["apartments"]
                if limits.max_apartments != -1
                else -1
            ),
            "rooms": (
                limits.max_rooms - usage["rooms"]
                if limits.max_rooms != -1
                else -1
            ),
            "members": (
                limits.max_members - usage["members"]
                if limits.max_members != -1
                else -1
            ),
            "can_invite": limits.can_create_team,
        }

    def check_apartment_limit(self, org_id: str, plan: str) -> Optional[str]:
        """
        Check apartment limit and return error message if exceeded.

        Args:
            org_id: Organization ID
            plan: Current plan

        Returns:
            Error message if limit exceeded, None otherwise
        """
        limits = self.get_plan_limits(plan)
        if limits.max_apartments == -1:
            return None

        usage = self.get_organization_usage(org_id)
        if usage["apartments"] >= limits.max_apartments:
            return f"已达到公寓数量上限（{limits.max_apartments} 个），请升级套餐"
        return None

    def check_room_limit(self, org_id: str, plan: str, count: int = 1) -> Optional[str]:
        """
        Check room limit and return error message if exceeded.

        Args:
            org_id: Organization ID
            plan: Current plan
            count: Number of rooms to create

        Returns:
            Error message if limit exceeded, None otherwise
        """
        limits = self.get_plan_limits(plan)
        if limits.max_rooms == -1:
            return None

        usage = self.get_organization_usage(org_id)
        if usage["rooms"] + count > limits.max_rooms:
            remaining = limits.max_rooms - usage["rooms"]
            return f"房间数量不足，当前可创建 {remaining} 个房间，请升级套餐"
        return None

    def check_member_limit(self, org_id: str, plan: str) -> Optional[str]:
        """
        Check member limit and return error message if exceeded.

        Args:
            org_id: Organization ID
            plan: Current plan

        Returns:
            Error message if limit exceeded, None otherwise
        """
        limits = self.get_plan_limits(plan)

        if not limits.can_create_team:
            return "免费用户无法邀请团队成员，请升级套餐"

        if limits.max_members == -1:
            return None

        usage = self.get_organization_usage(org_id)
        if usage["members"] >= limits.max_members:
            return f"已达到团队成员上限（{limits.max_members} 人），请升级套餐"
        return None
