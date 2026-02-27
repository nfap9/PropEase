"""
响应包装中间件。

将成功的响应数据包装为统一格式 {code, data, message}。

注意：此中间件仅处理路由直接返回的数据，
      异常响应由 exception_handlers 处理。
"""
import json
from typing import Any, Callable

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.configs.logging import get_logger

logger = get_logger(__name__)

# 不需要包装的路径前缀
SKIP_PATHS = {
    "/docs",
    "/redoc",
    "/openapi.json",
    "/health",
}

# 需要过滤掉的响应头（由 JSONResponse 自动计算）
HEADERS_TO_EXCLUDE = {
    "content-length",
    "content-encoding",
    "transfer-encoding",
}


class ResponseWrapperMiddleware(BaseHTTPMiddleware):
    """
    响应包装中间件。

    将控制器返回的数据自动包装为统一格式：
    {
        "code": 0,
        "data": <original_response>,
        "message": "操作成功"
    }

    对于已经是统一格式的响应，不再重复包装。
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # 跳过不需要包装的路径
        if self._should_skip(request.url.path):
            return await call_next(request)

        # 调用下一个处理器
        response = await call_next(request)

        # 仅处理成功的 JSON 响应
        if not self._should_wrap(response):
            return response

        # 读取响应体
        response_body = b""
        async for chunk in response.body_iterator:
            response_body += chunk

        try:
            # 解析原始响应
            original_data = json.loads(response_body.decode())

            # 如果已经是统一格式，直接返回
            if self._is_already_wrapped(original_data):
                return JSONResponse(
                    content=original_data,
                    status_code=response.status_code,
                    headers=self._filter_headers(response.headers),
                )

            # 包装响应
            wrapped_data = self._wrap_response(original_data)

            return JSONResponse(
                content=wrapped_data,
                status_code=response.status_code,
                headers=self._filter_headers(response.headers),
            )
        except (json.JSONDecodeError, UnicodeDecodeError):
            # 如果解析失败，返回原始响应
            return Response(
                content=response_body,
                status_code=response.status_code,
                headers=self._filter_headers(response.headers),
                media_type=response.media_type,
            )

    def _should_skip(self, path: str) -> bool:
        """检查是否应该跳过此路径"""
        return any(path.startswith(skip) for skip in SKIP_PATHS)

    def _should_wrap(self, response: Response) -> bool:
        """检查是否应该包装此响应"""
        # 只处理 2xx 状态码的 JSON 响应
        content_type = response.headers.get("content-type", "")
        return (
            200 <= response.status_code < 300
            and "application/json" in content_type
        )

    def _is_already_wrapped(self, data: Any) -> bool:
        """检查数据是否已经是统一格式"""
        return (
            isinstance(data, dict)
            and "code" in data
            and "data" in data
            and "message" in data
        )

    def _wrap_response(self, data: Any) -> dict:
        """包装响应数据"""
        return {
            "code": 0,
            "data": data,
            "message": "操作成功",
        }

    def _filter_headers(self, headers: dict) -> dict:
        """过滤掉会导致问题的响应头"""
        return {
            k: v
            for k, v in headers.items()
            if k.lower() not in HEADERS_TO_EXCLUDE
        }
