"""
统一响应格式模块。

提供标准化的 API 响应结构，包括：
- ApiResponse[T]: 通用响应包装器
- PaginatedData[T]: 分页数据结构
- ErrorDetail: 错误详情结构
- 响应构建工具函数
"""

from typing import Any, Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class ErrorDetail(BaseModel):
    """单个字段错误详情"""

    field: str = Field(description="错误字段名")
    message: str = Field(description="错误信息")


class ErrorData(BaseModel):
    """错误数据结构"""

    errors: list[ErrorDetail] = Field(default_factory=list, description="错误列表")


class PaginatedData(BaseModel, Generic[T]):
    """分页数据结构"""

    items: list[T] = Field(description="数据列表")
    total: int = Field(description="总记录数")
    page: int = Field(description="当前页码", ge=1)
    page_size: int = Field(description="每页记录数", ge=1, le=100)


class ApiResponse(BaseModel, Generic[T]):
    """
    统一 API 响应格式。

    Attributes:
        code: 业务状态码，0 表示成功
        data: 响应数据
        message: 提示信息
    """

    code: int = Field(default=0, description="业务状态码，0 表示成功")
    data: T | None = Field(default=None, description="响应数据")
    message: str = Field(default="操作成功", description="提示信息")

    model_config = {
        "populate_by_name": True,
        "from_attributes": True,
    }


# ==================== 工具函数 ====================


def success(data: Any = None, message: str = "操作成功") -> dict:
    """构建成功响应"""
    return {"code": 0, "data": data, "message": message}


def success_message(message: str) -> dict:
    """构建仅含消息的成功响应（用于删除等操作）"""
    return {"code": 0, "data": None, "message": message}


def paginated(
    items: list[Any],
    total: int,
    page: int = 1,
    page_size: int = 20,
    message: str = "操作成功",
) -> dict:
    """构建分页响应"""
    return {
        "code": 0,
        "data": {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
        },
        "message": message,
    }
