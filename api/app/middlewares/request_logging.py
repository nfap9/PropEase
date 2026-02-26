"""
Request logging middleware.

Logs incoming requests and outgoing responses with timing information.
"""
import logging
import time
import uuid
from collections.abc import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.configs.logging import (
    clear_context,
    get_logger,
    set_request_id,
)

logger = get_logger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    请求日志中间件。

    记录每个请求的详细信息，包括：
    - 请求方法和路径
    - 请求 ID
    - 响应状态码
    - 请求处理时间
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """处理请求并记录日志。"""
        # 生成请求 ID
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        set_request_id(request_id)

        # 记录请求开始
        start_time = time.time()
        method = request.method
        path = request.url.path

        logger.info(f"请求开始: {method} {path}")

        try:
            # 处理请求
            response = await call_next(request)

            # 计算处理时间
            process_time = time.time() - start_time
            process_time_ms = round(process_time * 1000, 2)

            # 记录请求完成
            log_level = logging.WARNING if response.status_code >= 400 else logging.INFO
            logger.log(
                log_level,
                f"请求完成: {method} {path} - 状态码 {response.status_code} - 耗时 {process_time_ms}ms",
            )

            # 添加响应头
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Process-Time"] = f"{process_time_ms}ms"

            return response

        except Exception as e:
            # 记录异常
            process_time = time.time() - start_time
            process_time_ms = round(process_time * 1000, 2)
            logger.exception(
                f"请求异常: {method} {path} - 耗时 {process_time_ms}ms - 错误: {str(e)}"
            )
            raise

        finally:
            # 清除上下文
            clear_context()


# 导入 logging 模块用于 log_level
