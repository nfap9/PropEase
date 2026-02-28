from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.configs.database import get_db
from app.models.organization import MemberRole, OrganizationMember
from app.models.user import User
from app.utils.security import decode_token

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user",
        )
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user",
        )
    return current_user


def get_current_organization(
    org_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OrganizationMember:
    membership = (
        db.query(OrganizationMember)
        .filter(
            OrganizationMember.organization_id == org_id,
            OrganizationMember.user_id == current_user.id,
        )
        .first()
    )
    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this organization",
        )
    return membership


def require_role(roles: list[MemberRole]):
    def role_checker(
        membership: OrganizationMember = Depends(get_current_organization),
    ) -> OrganizationMember:
        if membership.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return membership

    return role_checker


def require_permission(permission_code: str):
    """
    权限检查依赖工厂

    用法：
        @router.post("/apartments")
        def create_apartment(
            org_id: str,
            data: ApartmentCreate,
            _: None = Depends(require_permission("apartment:create")),
            current_user: User = Depends(get_current_user),
            db: Session = Depends(get_db),
        ):
            ...
    """
    from app.services.permission_service import PermissionService

    async def permission_checker(
        org_id: str,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> None:
        perm_service = PermissionService(db)
        if perm_service.check_permission(current_user.id, org_id, permission_code):
            return

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="没有权限执行此操作",
        )

    return permission_checker


def get_user_permissions(
    org_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[str]:
    """获取用户在当前组织中的所有权限代码"""
    from app.services.permission_service import PermissionService

    perm_service = PermissionService(db)
    return perm_service.get_user_permissions(current_user.id, org_id)


def get_current_user_system_roles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[str]:
    """获取当前用户的系统角色"""
    from app.services.permission_service import PermissionService

    perm_service = PermissionService(db)
    roles = perm_service.get_user_system_roles(current_user.id)
    return [r.value for r in roles]


def require_system_role(roles: list):
    """
    系统角色检查依赖工厂

    用法：
        @router.get("/admin/users")
        def list_all_users(
            _: None = Depends(require_system_role(["super_admin"])),
            current_user: User = Depends(get_current_user),
        ):
            ...
    """
    from app.services.permission_service import PermissionService

    async def role_checker(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> None:
        perm_service = PermissionService(db)
        user_roles = perm_service.get_user_system_roles(current_user.id)

        # 检查用户是否拥有任一指定角色
        for role in roles:
            if role in [r.value for r in user_roles]:
                return

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要系统管理员权限",
        )

    return role_checker


# ------------------------- 运营后台依赖 -------------------------


def get_current_admin_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    """
    获取当前运营后台登录用户。要求 JWT 中 type=admin，sub=admin_user_id。
    用于 /api/v1/admin/* 路由。
    """
    from app.models.admin_user import AdminUser
    from app.utils.security import decode_token

    token = credentials.credentials
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的凭证",
        )
    if payload.get("type") != "admin":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="需要运营后台登录",
        )
    admin_id = payload.get("sub")
    if not admin_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的凭证",
        )
    admin = db.query(AdminUser).filter(AdminUser.id == admin_id).first()
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="运营账号不存在",
        )
    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="账号已停用",
        )
    return admin
