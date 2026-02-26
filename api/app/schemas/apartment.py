from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.apartment import RoomStatus


class ApartmentBase(BaseModel):
    name: str
    address: Optional[str] = None
    description: Optional[str] = None


class ApartmentCreate(ApartmentBase):
    pass


class ApartmentUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    description: Optional[str] = None


class ApartmentResponse(ApartmentBase):
    id: int
    organization_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class RoomBase(BaseModel):
    room_number: str
    monthly_rent: float
    area: Optional[float] = None
    notes: Optional[str] = None


class RoomCreate(RoomBase):
    apartment_id: int
    status: RoomStatus = RoomStatus.AVAILABLE


class RoomUpdate(BaseModel):
    room_number: Optional[str] = None
    status: Optional[RoomStatus] = None
    monthly_rent: Optional[float] = None
    area: Optional[float] = None
    notes: Optional[str] = None


class RoomResponse(RoomBase):
    id: int
    apartment_id: int
    status: RoomStatus
    created_at: datetime

    class Config:
        from_attributes = True


class RoomWithApartment(RoomResponse):
    apartment: Optional[ApartmentResponse] = None
