from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

from app.schemas.apartment import RoomWithApartment


class UtilityReadingBase(BaseModel):
    room_id: str
    period_year: int
    period_month: int
    reading_date: date
    water_reading: Optional[float] = None
    electricity_reading: Optional[float] = None
    water_previous: Optional[float] = None
    electricity_previous: Optional[float] = None
    notes: Optional[str] = None


class UtilityReadingCreate(UtilityReadingBase):
    pass


class UtilityReadingUpdate(BaseModel):
    reading_date: Optional[date] = None
    water_reading: Optional[float] = None
    electricity_reading: Optional[float] = None
    water_previous: Optional[float] = None
    electricity_previous: Optional[float] = None
    notes: Optional[str] = None


class UtilityReadingResponse(UtilityReadingBase):
    id: str
    room: Optional[RoomWithApartment] = None
    created_at: datetime

    class Config:
        from_attributes = True


class BatchUtilityReading(BaseModel):
    period_year: int
    period_month: int
    reading_date: date
    readings: list[dict]


class UtilityExportRoom(BaseModel):
    """待录入水电的房间信息（用于导出）"""
    room_id: str
    apartment_name: str
    room_number: str
    tenant_name: str
    billing_day: int
    water_previous: Optional[float] = None
    electricity_previous: Optional[float] = None


class UtilityExportRequest(BaseModel):
    """导出请求参数"""
    period_year: int
    period_month: int
    days_range: Optional[int] = None  # None 表示全部，否则为天数（5, 10, 15, 30）


# Alias for controller import
BatchUtilityReadingCreate = BatchUtilityReading
