"""
Common error responses and exceptions.
"""
from fastapi import HTTPException, status


class AppError(HTTPException):
    """Base application error."""

    def __init__(self, status_code: int, detail: str):
        super().__init__(status_code=status_code, detail=detail)


class NotFoundError(AppError):
    """Resource not found error."""

    def __init__(self, resource: str = "Resource"):
        super().__init__(status.HTTP_404_NOT_FOUND, f"{resource} not found")


class ForbiddenError(AppError):
    """Forbidden access error."""

    def __init__(self, detail: str = "Access denied"):
        super().__init__(status.HTTP_403_FORBIDDEN, detail)


class BadRequestError(AppError):
    """Bad request error."""

    def __init__(self, detail: str):
        super().__init__(status.HTTP_400_BAD_REQUEST, detail)


class ConflictError(AppError):
    """Conflict error (e.g., duplicate resource)."""

    def __init__(self, detail: str):
        super().__init__(status.HTTP_409_CONFLICT, detail)


class UnauthorizedError(AppError):
    """Unauthorized error."""

    def __init__(self, detail: str = "Could not validate credentials"):
        super().__init__(status.HTTP_401_UNAUTHORIZED, detail)
