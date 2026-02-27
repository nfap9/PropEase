"""
Default permission configurations for roles.
"""
from app.models.permission import Resource, Action, SystemRole
from app.models.organization import MemberRole


# 资源中文名称
RESOURCE_NAMES: dict[Resource, str] = {
    Resource.APARTMENT: "公寓管理",
    Resource.ROOM: "房间管理",
    Resource.TENANT: "租客管理",
    Resource.LEASE: "租约管理",
    Resource.BILL: "账单管理",
    Resource.UTILITY: "水电管理",
    Resource.MEMBER: "成员管理",
    Resource.SETTINGS: "系统设置",
    Resource.REPORT: "报表分析",
}

# 操作中文名称
ACTION_NAMES: dict[Action, str] = {
    Action.VIEW: "查看",
    Action.CREATE: "创建",
    Action.EDIT: "编辑",
    Action.DELETE: "删除",
    Action.EXPORT: "导出",
    Action.MANAGE: "管理（全部）",
}


def get_permission_name(resource: Resource, action: Action) -> str:
    """生成权限显示名称"""
    return f"{RESOURCE_NAMES.get(resource, resource.value)}{ACTION_NAMES.get(action, action.value)}"


# 组织角色默认权限配置
# owner 角色拥有所有权限，不可修改
DEFAULT_ORG_PERMISSIONS: dict[MemberRole, list[tuple[Resource, Action]]] = {
    MemberRole.OWNER: [
        # owner 拥有所有权限
        (Resource.APARTMENT, Action.VIEW),
        (Resource.APARTMENT, Action.CREATE),
        (Resource.APARTMENT, Action.EDIT),
        (Resource.APARTMENT, Action.DELETE),
        (Resource.ROOM, Action.VIEW),
        (Resource.ROOM, Action.CREATE),
        (Resource.ROOM, Action.EDIT),
        (Resource.ROOM, Action.DELETE),
        (Resource.TENANT, Action.VIEW),
        (Resource.TENANT, Action.CREATE),
        (Resource.TENANT, Action.EDIT),
        (Resource.TENANT, Action.DELETE),
        (Resource.LEASE, Action.VIEW),
        (Resource.LEASE, Action.CREATE),
        (Resource.LEASE, Action.EDIT),
        (Resource.LEASE, Action.DELETE),
        (Resource.BILL, Action.VIEW),
        (Resource.BILL, Action.CREATE),
        (Resource.BILL, Action.EDIT),
        (Resource.BILL, Action.DELETE),
        (Resource.BILL, Action.EXPORT),
        (Resource.UTILITY, Action.VIEW),
        (Resource.UTILITY, Action.CREATE),
        (Resource.UTILITY, Action.EDIT),
        (Resource.UTILITY, Action.DELETE),
        (Resource.MEMBER, Action.VIEW),
        (Resource.MEMBER, Action.CREATE),
        (Resource.MEMBER, Action.EDIT),
        (Resource.MEMBER, Action.DELETE),
        (Resource.SETTINGS, Action.VIEW),
        (Resource.SETTINGS, Action.EDIT),
        (Resource.REPORT, Action.VIEW),
        (Resource.REPORT, Action.EXPORT),
    ],
    MemberRole.ADMIN: [
        # admin 拥有除了删除组织和修改权限外的所有权限
        (Resource.APARTMENT, Action.VIEW),
        (Resource.APARTMENT, Action.CREATE),
        (Resource.APARTMENT, Action.EDIT),
        (Resource.APARTMENT, Action.DELETE),
        (Resource.ROOM, Action.VIEW),
        (Resource.ROOM, Action.CREATE),
        (Resource.ROOM, Action.EDIT),
        (Resource.ROOM, Action.DELETE),
        (Resource.TENANT, Action.VIEW),
        (Resource.TENANT, Action.CREATE),
        (Resource.TENANT, Action.EDIT),
        (Resource.TENANT, Action.DELETE),
        (Resource.LEASE, Action.VIEW),
        (Resource.LEASE, Action.CREATE),
        (Resource.LEASE, Action.EDIT),
        (Resource.LEASE, Action.DELETE),
        (Resource.BILL, Action.VIEW),
        (Resource.BILL, Action.CREATE),
        (Resource.BILL, Action.EDIT),
        (Resource.BILL, Action.DELETE),
        (Resource.BILL, Action.EXPORT),
        (Resource.UTILITY, Action.VIEW),
        (Resource.UTILITY, Action.CREATE),
        (Resource.UTILITY, Action.EDIT),
        (Resource.UTILITY, Action.DELETE),
        (Resource.MEMBER, Action.VIEW),
        (Resource.MEMBER, Action.CREATE),
        (Resource.MEMBER, Action.EDIT),
        # admin 不能删除成员
        (Resource.SETTINGS, Action.VIEW),
        (Resource.SETTINGS, Action.EDIT),
        (Resource.REPORT, Action.VIEW),
        (Resource.REPORT, Action.EXPORT),
    ],
    MemberRole.MEMBER: [
        # member 日常操作权限
        (Resource.APARTMENT, Action.VIEW),
        (Resource.ROOM, Action.VIEW),
        (Resource.ROOM, Action.EDIT),  # 可以修改房间状态
        (Resource.TENANT, Action.VIEW),
        (Resource.TENANT, Action.CREATE),
        (Resource.TENANT, Action.EDIT),
        (Resource.LEASE, Action.VIEW),
        (Resource.LEASE, Action.CREATE),
        (Resource.LEASE, Action.EDIT),
        (Resource.BILL, Action.VIEW),
        (Resource.BILL, Action.CREATE),
        (Resource.BILL, Action.EDIT),
        (Resource.UTILITY, Action.VIEW),
        (Resource.UTILITY, Action.CREATE),
        (Resource.UTILITY, Action.EDIT),
        (Resource.MEMBER, Action.VIEW),
        (Resource.SETTINGS, Action.VIEW),
        (Resource.REPORT, Action.VIEW),
    ],
    MemberRole.VIEWER: [
        # viewer 只读权限
        (Resource.APARTMENT, Action.VIEW),
        (Resource.ROOM, Action.VIEW),
        (Resource.TENANT, Action.VIEW),
        (Resource.LEASE, Action.VIEW),
        (Resource.BILL, Action.VIEW),
        (Resource.UTILITY, Action.VIEW),
        (Resource.MEMBER, Action.VIEW),
        (Resource.REPORT, Action.VIEW),
    ],
}


# 系统角色默认权限配置
DEFAULT_SYSTEM_ROLE_PERMISSIONS: dict[SystemRole, list[tuple[Resource, Action]]] = {
    SystemRole.SUPER_ADMIN: [
        # 超级管理员拥有所有权限
        (r, a)
        for r in Resource
        for a in [Action.VIEW, Action.CREATE, Action.EDIT, Action.DELETE, Action.EXPORT]
    ],
    SystemRole.SUPPORT: [
        # 客服：只读权限
        (Resource.APARTMENT, Action.VIEW),
        (Resource.ROOM, Action.VIEW),
        (Resource.TENANT, Action.VIEW),
        (Resource.TENANT, Action.EDIT),  # 可以修改租客信息
        (Resource.LEASE, Action.VIEW),
        (Resource.BILL, Action.VIEW),
        (Resource.UTILITY, Action.VIEW),
        (Resource.MEMBER, Action.VIEW),
        (Resource.REPORT, Action.VIEW),
    ],
    SystemRole.OPERATIONS: [
        # 运营：查看和导出权限
        (Resource.APARTMENT, Action.VIEW),
        (Resource.ROOM, Action.VIEW),
        (Resource.TENANT, Action.VIEW),
        (Resource.LEASE, Action.VIEW),
        (Resource.BILL, Action.VIEW),
        (Resource.BILL, Action.EXPORT),
        (Resource.UTILITY, Action.VIEW),
        (Resource.MEMBER, Action.VIEW),
        (Resource.SETTINGS, Action.VIEW),
        (Resource.REPORT, Action.VIEW),
        (Resource.REPORT, Action.EXPORT),
    ],
    SystemRole.FINANCE: [
        # 财务：账单和报表相关权限
        (Resource.BILL, Action.VIEW),
        (Resource.BILL, Action.CREATE),
        (Resource.BILL, Action.EDIT),
        (Resource.BILL, Action.EXPORT),
        (Resource.LEASE, Action.VIEW),
        (Resource.TENANT, Action.VIEW),
        (Resource.ROOM, Action.VIEW),
        (Resource.REPORT, Action.VIEW),
        (Resource.REPORT, Action.EXPORT),
    ],
    SystemRole.READONLY: [
        # 只读：只能查看
        (Resource.APARTMENT, Action.VIEW),
        (Resource.ROOM, Action.VIEW),
        (Resource.TENANT, Action.VIEW),
        (Resource.LEASE, Action.VIEW),
        (Resource.BILL, Action.VIEW),
        (Resource.UTILITY, Action.VIEW),
        (Resource.MEMBER, Action.VIEW),
    ],
}


# 系统角色配置
SYSTEM_ROLE_CONFIGS: list[dict] = [
    {
        "role": SystemRole.SUPER_ADMIN,
        "name": "超级管理员",
        "description": "拥有系统所有权限，可管理所有组织",
    },
    {
        "role": SystemRole.SUPPORT,
        "name": "客服",
        "description": "可查看所有组织数据，协助用户解决问题",
    },
    {
        "role": SystemRole.OPERATIONS,
        "name": "运营",
        "description": "可查看和导出数据，进行运营分析",
    },
    {
        "role": SystemRole.FINANCE,
        "name": "财务",
        "description": "可管理账单和查看财务报表",
    },
    {
        "role": SystemRole.READONLY,
        "name": "只读",
        "description": "只能查看数据，无修改权限",
    },
]
