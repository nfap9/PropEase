"""
Rate limiting middleware for API protection.

Limits the number of requests per IP address within a time window.
"""

import time
from collections import defaultdict
from threading import Lock

from fastapi import HTTPException, Request
from starlette.middleware.base import BaseHTTPMiddleware

from app.configs import settings


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    基于IP的请求频率限制中间件。

    在指定时间窗口内限制每个IP的请求数量。
    """

    def __init__(self, app):
        super().__init__(app)
        self.requests: dict[str, list[float]] = defaultdict(list)
        self.lock = Lock()
        self.max_requests = settings.RATE_LIMIT_REQUESTS
        self.window_seconds = settings.RATE_LIMIT_PERIOD

    def _cleanup_old_requests(self, ip: str, current_time: float) -> None:
        """清理过期的请求记录。"""
        cutoff = current_time - self.window_seconds
        self.requests[ip] = [t for t in self.requests[ip] if t > cutoff]

    def _is_rate_limited(self, ip: str) -> bool:
        """检查IP是否超过请求限制。"""
        current_time = time.time()

        with self.lock:
            self._cleanup_old_requests(ip, current_time)

            if len(self.requests[ip]) >= self.max_requests:
                return True

            self.requests[ip].append(current_time)
            return False

    async def dispatch(self, request: Request, call_next):
        """处理请求并应用频率限制。"""
        # 获取客户端IP
        client_ip = self._get_client_ip(request)

        # 检查频率限制
        if self._is_rate_limited(client_ip):
            raise HTTPException(
                status_code=429,
                detail="请求过于频繁，请稍后再试",
                headers={"Retry-After": str(self.window_seconds)},
            )

        return await call_next(request)

    def _get_client_ip(self, request: Request) -> str:
        """获取客户端真实IP地址。"""
        # 检查代理头
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()

        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip

        # 回退到直接连接IP
        if request.client:
            return request.client.host

        return "unknown"
