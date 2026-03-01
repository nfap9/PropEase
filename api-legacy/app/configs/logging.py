"""
Logging configuration for the application.

Provides structured JSON logging with context support.
"""

import json
import logging
import sys
from contextvars import ContextVar
from datetime import UTC, datetime
from typing import Any

# Context variables for request tracking
request_id_ctx: ContextVar[str | None] = ContextVar("request_id", default=None)
tenant_id_ctx: ContextVar[str | None] = ContextVar("tenant_id", default=None)
user_id_ctx: ContextVar[str | None] = ContextVar("user_id", default=None)


class JSONFormatter(logging.Formatter):
    """JSON 格式化器，输出结构化日志。"""

    def format(self, record: logging.LogRecord) -> str:
        """格式化日志记录为 JSON。"""
        log_data: dict[str, Any] = {
            "timestamp": datetime.now(UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # 添加上下文信息
        if request_id := request_id_ctx.get():
            log_data["request_id"] = request_id
        if tenant_id := tenant_id_ctx.get():
            log_data["tenant_id"] = tenant_id
        if user_id := user_id_ctx.get():
            log_data["user_id"] = user_id

        # 添加异常信息
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        # 添加额外字段
        if hasattr(record, "extra_data"):
            log_data["data"] = record.extra_data

        return json.dumps(log_data, ensure_ascii=False)


class ConsoleFormatter(logging.Formatter):
    """控制台格式化器，输出可读的彩色日志。"""

    COLORS = {
        "DEBUG": "\033[36m",  # 青色
        "INFO": "\033[32m",  # 绿色
        "WARNING": "\033[33m",  # 黄色
        "ERROR": "\033[31m",  # 红色
        "CRITICAL": "\033[35m",  # 紫色
    }
    RESET = "\033[0m"

    def format(self, record: logging.LogRecord) -> str:
        """格式化日志记录为可读的控制台输出。"""
        color = self.COLORS.get(record.levelname, "")
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # 构建基础日志行
        parts = [
            f"{color}[{record.levelname}]{self.RESET}",
            f"{timestamp}",
            f"{record.name}:",
            record.getMessage(),
        ]

        # 添加上下文信息
        context_parts = []
        if request_id := request_id_ctx.get():
            context_parts.append(f"req={request_id[:8]}")
        if tenant_id := tenant_id_ctx.get():
            context_parts.append(f"org={tenant_id}")
        if context_parts:
            parts.append(f"[{', '.join(context_parts)}]")

        # 添加异常信息
        if record.exc_info:
            parts.append(f"\n{self.formatException(record.exc_info)}")

        return " ".join(parts)


def setup_logging(debug: bool = False, json_format: bool = False) -> None:
    """
    配置应用日志。

    Args:
        debug: 是否启用调试级别日志
        json_format: 是否使用 JSON 格式输出
    """
    log_level = logging.DEBUG if debug else logging.INFO

    # 选择格式化器
    if json_format:
        formatter: logging.Formatter = JSONFormatter()
    else:
        formatter = ConsoleFormatter()

    # 配置根日志器
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)

    # 移除现有处理器
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # 添加控制台处理器
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    # 配置第三方库日志级别
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """
    获取指定名称的日志器。

    Args:
        name: 日志器名称

    Returns:
        配置好的日志器实例
    """
    return logging.getLogger(name)


# 便捷函数
def set_request_id(request_id: str) -> None:
    """设置当前请求 ID。"""
    request_id_ctx.set(request_id)


def set_tenant_id(tenant_id: str) -> None:
    """设置当前租户 ID。"""
    tenant_id_ctx.set(tenant_id)


def set_user_id(user_id: str) -> None:
    """设置当前用户 ID。"""
    user_id_ctx.set(user_id)


def clear_context() -> None:
    """清除所有上下文变量。"""
    request_id_ctx.set(None)
    tenant_id_ctx.set(None)
    user_id_ctx.set(None)
