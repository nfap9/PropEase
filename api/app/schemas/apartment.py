from datetime import datetime

from pydantic import BaseModel

from app.models.apartment import RoomStatus


class ApartmentBase(BaseModel):
    name: str
    address: str | None = None
    description: str | None = None


class ApartmentCreate(ApartmentBase):
    pass


class ApartmentUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    description: str | None = None


class RoomStats(BaseModel):
    """房间统计信息"""

    total: int
    available: int
    occupied: int
    maintenance: int


class ApartmentResponse(ApartmentBase):
    id: str
    organization_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class ApartmentWithStatsResponse(ApartmentResponse):
    """带房间统计信息的公寓响应"""

    room_stats: RoomStats


class RoomBase(BaseModel):
    room_number: str
    layout: str | None = None  # 户型
    monthly_rent: float
    area: float | None = None
    notes: str | None = None


class RoomCreate(RoomBase):
    apartment_id: str
    status: RoomStatus = RoomStatus.AVAILABLE


class RoomBatchCreate(BaseModel):
    """批量创建房间"""

    room_numbers: list[str]  # 房间号列表
    layout: str | None = None  # 户型
    monthly_rent: float  # 月租
    area: float | None = None  # 面积
    notes: str | None = None  # 备注


class RoomUpdate(BaseModel):
    room_number: str | None = None
    layout: str | None = None  # 户型
    status: RoomStatus | None = None
    monthly_rent: float | None = None
    area: float | None = None
    notes: str | None = None


class RoomResponse(RoomBase):
    id: str
    apartment_id: str
    status: RoomStatus
    created_at: datetime

    class Config:
        from_attributes = True


class RoomWithApartment(RoomResponse):
    apartment: ApartmentResponse | None = None
