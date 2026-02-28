from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TenantBase(BaseModel):
    name: str
    phone: Optional[str] = None
    id_card: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    notes: Optional[str] = None


class TenantCreate(TenantBase):
    pass


class TenantUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    id_card: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    notes: Optional[str] = None


class TenantResponse(TenantBase):
    id: str
    organization_id: str
    created_at: datetime

    class Config:
        from_attributes = True
