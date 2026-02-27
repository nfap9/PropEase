"""
全局异常处理器。

处理所有未被控制器捕获的异常，转换为统一响应格式。
"""
from typing import Any

from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError, HTTPException

from app.controllers.common.errors import (
    AppError,
    BusinessCode,
    FieldError,
)
from app.configs.logging import get_logger

logger = get_logger(__name__)


def create_error_response(
    code: int,
    message: str,
    data: Any = None,
) -> dict:
    """创建错误响应字典"""
    return {
        "code": code,
        "data": data,
        "message": message,
    }


async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    """处理 AppError 异常"""
    # 构建错误数据
    error_data = None
    if exc.field_errors:
        error_data = {
            "errors": [
                {"field": e.field, "message": e.message} for e in exc.field_errors
            ]
        }

    return JSONResponse(
        status_code=exc.status_code,
        content=create_error_response(
            code=exc.business_code,
            message=exc.detail,
            data=error_data,
        ),
    )


def _map_http_status_to_business_code(status_code: int) -> int:
    """将 HTTP 状态码映射到业务状态码"""
    mapping = {
        status.HTTP_400_BAD_REQUEST: BusinessCode.BAD_REQUEST,
        status.HTTP_401_UNAUTHORIZED: BusinessCode.UNAUTHORIZED,
        status.HTTP_403_FORBIDDEN: BusinessCode.FORBIDDEN,
        status.HTTP_404_NOT_FOUND: BusinessCode.NOT_FOUND,
        status.HTTP_409_CONFLICT: BusinessCode.CONFLICT,
        status.HTTP_422_UNPROCESSABLE_ENTITY: BusinessCode.VALIDATION_ERROR,
    }
    return mapping.get(status_code, BusinessCode.INTERNAL_ERROR)


async def http_exception_handler(
    request: Request, exc: HTTPException
) -> JSONResponse:
    """
    处理 HTTPException 异常。

    将 FastAPI 的 HTTPException 转换为统一响应格式。
    """
    business_code = _map_http_status_to_business_code(exc.status_code)
    return JSONResponse(
        status_code=exc.status_code,
        content=create_error_response(
            code=business_code,
            message=exc.detail,
        ),
    )


async def validation_error_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    """
    处理 FastAPI 参数校验错误。

    将 Pydantic 校验错误转换为统一格式。
    """
    field_errors = []
    for error in exc.errors():
        # 获取字段名（支持嵌套字段如 body.room_id）
        loc = error.get("loc", [])
        field_path = ".".join(str(part) for part in loc if part != "body")
        field_errors.append(
            FieldError(
                field=field_path,
                message=error["msg"],
            )
        )

    error_data = {
        "errors": [{"field": e.field, "message": e.message} for e in field_errors]
    }

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=create_error_response(
            code=BusinessCode.VALIDATION_ERROR,
            message="参数校验失败",
            data=error_data,
        ),
    )


async def generic_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    """
    处理未捕获的通用异常。

    记录错误日志并返回统一的服务器错误响应。
    """
    logger.exception(
        f"未处理的异常: {type(exc).__name__}: {str(exc)} "
        f"path={request.url.path} method={request.method}"
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=create_error_response(
            code=BusinessCode.INTERNAL_ERROR,
            message="服务器内部错误",
        ),
    )
