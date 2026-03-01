"""
运营后台登录接口。

登录前按 IP 做速率限制；登录失败次数过多会触发账号锁定，此处仅透传服务层错误信息。
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.configs.database import get_db
from app.controllers.common.errors import UnauthorizedError
from app.schemas.admin import AdminLogin, AdminToken
from app.services.admin_auth_service import AdminAuthService
from app.utils.admin_login_rate_limit import is_admin_login_rate_limited

router = APIRouter()


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.headers.get("X-Real-IP"):
        return request.headers.get("X-Real-IP") or "unknown"
    return request.client.host if request.client else "unknown"


def get_admin_auth_service(db: Session = Depends(get_db)) -> AdminAuthService:
    return AdminAuthService(db)


@router.post("/login", response_model=AdminToken)
def admin_login(
    request: Request,
    data: AdminLogin,
    auth_service: AdminAuthService = Depends(get_admin_auth_service),
):
    """运营后台登录，返回 access_token。受 IP 速率限制与账号锁定约束。"""
    ip = _client_ip(request)
    if is_admin_login_rate_limited(ip):
        raise HTTPException(
            status_code=429,
            detail="登录尝试过于频繁，请稍后再试",
            headers={"Retry-After": "60"},
        )
    try:
        return auth_service.login(data)
    except ValueError as e:
        msg = str(e)
        if "停用" in msg:
            raise UnauthorizedError(msg) from e
        if "锁定" in msg:
            raise UnauthorizedError(msg) from e
        raise UnauthorizedError("用户名或密码错误") from e
