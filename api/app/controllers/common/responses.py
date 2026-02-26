"""
Common response helpers.
"""
from typing import Any, Optional
from pydantic import BaseModel


class SuccessResponse(BaseModel):
    """Standard success response."""

    success: bool = True
    message: str = "Operation completed successfully"


class ErrorResponse(BaseModel):
    """Standard error response."""

    success: bool = False
    error: str
    detail: Optional[str] = None


class PaginatedResponse(BaseModel):
    """Paginated response wrapper."""

    items: list[Any]
    total: int
    skip: int
    limit: int


def success(message: str = "Operation completed successfully") -> dict:
    """Return a success response."""
    return {"success": True, "message": message}
