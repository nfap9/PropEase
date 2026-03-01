from datetime import date, datetime

from pydantic import BaseModel

from app.schemas.apartment import RoomWithApartment


class UtilityReadingBase(BaseModel):
    room_id: str
    period_year: int
    period_month: int
    reading_date: date
    water_reading: float | None = None
    electricity_reading: float | None = None
    water_previous: float | None = None
    electricity_previous: float | None = None
    notes: str | None = None


class UtilityReadingCreate(UtilityReadingBase):
    pass


class UtilityReadingUpdate(BaseModel):
    reading_date: date | None = None
    water_reading: float | None = None
    electricity_reading: float | None = None
    water_previous: float | None = None
    electricity_previous: float | None = None
    notes: str | None = None


class UtilityReadingResponse(UtilityReadingBase):
    id: str
    room: RoomWithApartment | None = None
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
    water_previous: float | None = None
    electricity_previous: float | None = None


class UtilityExportRequest(BaseModel):
    """导出请求参数"""

    period_year: int
    period_month: int
    days_range: int | None = None  # None 表示全部，否则为天数（5, 10, 15, 30）


# Alias for controller import
BatchUtilityReadingCreate = BatchUtilityReading
