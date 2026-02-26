from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class UtilityReadingBase(BaseModel):
    room_id: int
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
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class BatchUtilityReading(BaseModel):
    period_year: int
    period_month: int
    reading_date: date
    readings: list[dict]


# Alias for controller import
BatchUtilityReadingCreate = BatchUtilityReading
