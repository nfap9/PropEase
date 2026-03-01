"""
自定义SQLAlchemy类型定义。
"""

from typing import Any

from sqlalchemy import String, TypeDecorator


class ULIDType(TypeDecorator):
    """
    SQLAlchemy ULID类型，使用VARCHAR(26)存储。

    在Python层使用字符串表示ULID，数据库层存储为VARCHAR(26)。
    这样可以保持API层的一致性和可读性。

    ULID特性:
    - 26字符的字符串标识符
    - 时间排序，支持索引优化
    - URL友好，无特殊字符
    """

    impl = String(26)
    cache_ok = True

    def process_bind_param(self, value: Any, dialect) -> str | None:
        """将Python值转换为数据库存储格式。"""
        if value is None:
            return None
        if isinstance(value, str):
            if len(value) != 26:
                raise ValueError(f"Invalid ULID length: {len(value)}, expected 26")
            return value
        raise ValueError(f"Invalid ULID value type: {type(value)}")

    def process_result_value(self, value: Any, dialect) -> str | None:
        """将数据库值转换为Python格式。"""
        if value is None:
            return None
        return str(value)
