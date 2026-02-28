"""
运营分析：平台级统计接口。
"""
from fastapi import APIRouter, Depends

from app.configs.database import get_db
from app.dependencies import get_current_admin_user
from app.schemas.admin import AdminPlatformStatsResponse
from app.services.admin_stats_service import AdminStatsService
from sqlalchemy.orm import Session

router = APIRouter(dependencies=[Depends(get_current_admin_user)])


def get_admin_stats_service(db: Session = Depends(get_db)) -> AdminStatsService:
    return AdminStatsService(db)


@router.get("/stats", response_model=AdminPlatformStatsResponse)
def get_platform_stats(
    service: AdminStatsService = Depends(get_admin_stats_service),
):
    """平台级数据统计（组织数、用户数、公寓数、房间数、活跃订阅数）。"""
    stats = service.get_platform_stats()
    return AdminPlatformStatsResponse.model_validate(stats)
