from datetime import datetime

from pydantic import BaseModel


class TenantBase(BaseModel):
    name: str
    phone: str | None = None
    id_card: str | None = None
    emergency_contact: str | None = None
    emergency_phone: str | None = None
    notes: str | None = None


class TenantCreate(TenantBase):
    pass


class TenantUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    id_card: str | None = None
    emergency_contact: str | None = None
    emergency_phone: str | None = None
    notes: str | None = None


class TenantResponse(TenantBase):
    id: str
    organization_id: str
    created_at: datetime

    class Config:
        from_attributes = True
