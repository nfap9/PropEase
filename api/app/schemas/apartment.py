from pydantic import BaseModel
from typing import Optional, List
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


class RoomStats(BaseModel):
    """房间统计信息"""
    total: int
    available: int
    occupied: int
    maintenance: int


class ApartmentResponse(ApartmentBase):
    id: int
    organization_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ApartmentWithStatsResponse(ApartmentResponse):
    """带房间统计信息的公寓响应"""
    room_stats: RoomStats


class RoomBase(BaseModel):
    room_number: str
    layout: Optional[str] = None  # 户型
    monthly_rent: float
    area: Optional[float] = None
    notes: Optional[str] = None


class RoomCreate(RoomBase):
    apartment_id: int
    status: RoomStatus = RoomStatus.AVAILABLE


class RoomBatchCreate(BaseModel):
    """批量创建房间"""
    room_numbers: List[str]  # 房间号列表
    layout: Optional[str] = None  # 户型
    monthly_rent: float  # 月租
    area: Optional[float] = None  # 面积
    notes: Optional[str] = None  # 备注


class RoomUpdate(BaseModel):
    room_number: Optional[str] = None
    layout: Optional[str] = None  # 户型
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
