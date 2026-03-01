"""
Common error responses and exceptions.

业务状态码约定：
- 0: 成功
- 4xxxx: 客户端错误
- 5xxxx: 服务端错误
"""

from dataclasses import dataclass
from enum import IntEnum

from fastapi import HTTPException, status


class BusinessCode(IntEnum):
    """业务状态码枚举"""

    SUCCESS = 0

    # 4xxxx 客户端错误
    BAD_REQUEST = 40000
    VALIDATION_ERROR = 40001  # 参数校验错误
    NOT_FOUND = 40002  # 资源未找到
    FORBIDDEN = 40003  # 权限不足
    UNAUTHORIZED = 40004  # 认证失败

    # 409xx 冲突错误
    CONFLICT = 40900
    DUPLICATE_RESOURCE = 40901  # 资源重复

    # 5xxxx 服务端错误
    INTERNAL_ERROR = 50000


@dataclass
class FieldError:
    """字段错误（用于参数校验）"""

    field: str
    message: str


class AppError(HTTPException):
    """
    基础应用异常。

    Attributes:
        status_code: HTTP 状态码
        business_code: 业务状态码
        detail: 错误详情（字符串）
        field_errors: 字段级错误列表
    """

    def __init__(
        self,
        status_code: int,
        business_code: int = BusinessCode.BAD_REQUEST,
        detail: str = "An error occurred",
        field_errors: list[FieldError] | None = None,
    ):
        self.business_code = business_code
        self.field_errors = field_errors or []
        super().__init__(status_code=status_code, detail=detail)


class NotFoundError(AppError):
    """资源未找到错误"""

    def __init__(self, resource: str = "Resource"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            business_code=BusinessCode.NOT_FOUND,
            detail=f"{resource} not found",
        )


class ForbiddenError(AppError):
    """权限不足错误"""

    def __init__(self, detail: str = "Access denied"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            business_code=BusinessCode.FORBIDDEN,
            detail=detail,
        )


class BadRequestError(AppError):
    """请求参数错误"""

    def __init__(
        self,
        detail: str,
        field_errors: list[FieldError] | None = None,
    ):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            business_code=BusinessCode.BAD_REQUEST,
            detail=detail,
            field_errors=field_errors,
        )


class ValidationError(AppError):
    """参数校验错误"""

    def __init__(self, field_errors: list[FieldError], detail: str = "参数校验失败"):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            business_code=BusinessCode.VALIDATION_ERROR,
            detail=detail,
            field_errors=field_errors,
        )


class ConflictError(AppError):
    """资源冲突错误"""

    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            business_code=BusinessCode.CONFLICT,
            detail=detail,
        )


class UnauthorizedError(AppError):
    """认证失败错误"""

    def __init__(self, detail: str = "Could not validate credentials"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            business_code=BusinessCode.UNAUTHORIZED,
            detail=detail,
        )
