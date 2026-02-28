"""
运营后台登录接口。
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.configs.database import get_db
from app.controllers.common.errors import UnauthorizedError
from app.schemas.admin import AdminLogin, AdminToken
from app.services.admin_auth_service import AdminAuthService

router = APIRouter()


def get_admin_auth_service(db: Session = Depends(get_db)) -> AdminAuthService:
    return AdminAuthService(db)


@router.post("/login", response_model=AdminToken)
def admin_login(
    data: AdminLogin,
    auth_service: AdminAuthService = Depends(get_admin_auth_service),
):
    """运营后台登录，返回 access_token。"""
    try:
        return auth_service.login(data)
    except ValueError as e:
        if "停用" in str(e):
            raise UnauthorizedError(str(e)) from e
        raise UnauthorizedError("用户名或密码错误") from e
