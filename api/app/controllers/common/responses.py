"""
Common response helpers.

已废弃：请使用 response.py 中的统一响应格式。
此文件保留仅为向后兼容。
"""

from app.controllers.common.response import (
    ApiResponse,
    ErrorData,
    ErrorDetail,
    PaginatedData,
    paginated,
    success,
    success_message,
)

__all__ = [
    "ApiResponse",
    "PaginatedData",
    "ErrorDetail",
    "ErrorData",
    "success",
    "success_message",
    "paginated",
]
