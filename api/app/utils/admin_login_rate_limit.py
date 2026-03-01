"""
运营后台登录接口按 IP 的速率限制。

与全局 RateLimitMiddleware 独立，对 POST /api/v1/admin/auth/login 使用更严格限制，
防止暴力破解。
"""

import time
from collections import defaultdict
from threading import Lock

from app.configs import settings

_WINDOW_SECONDS = 60
_requests: dict[str, list[float]] = defaultdict(list)
_lock = Lock()


def _cleanup(ip: str, now: float) -> None:
    cutoff = now - _WINDOW_SECONDS
    _requests[ip] = [t for t in _requests[ip] if t > cutoff]


def is_admin_login_rate_limited(ip: str) -> bool:
    """
    记录一次登录尝试并判断该 IP 是否超过限制。
    返回 True 表示应拒绝请求（429）；False 表示可继续。
    """
    now = time.time()
    max_per_minute = settings.ADMIN_LOGIN_RATE_LIMIT_PER_MINUTE
    with _lock:
        _cleanup(ip, now)
        if len(_requests[ip]) >= max_per_minute:
            return True
        _requests[ip].append(now)
        return False
