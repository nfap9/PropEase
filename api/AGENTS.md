# API 开发指南

## AI 助手必读（必查）

在修改 `api/` 下的任何后端代码之前，**必须**阅读周围的文档字符串和注释。这些注释包含必要的上下文（不变量、边界情况、权衡取舍），应被视为规范的一部分。

查找：

- 源代码文件顶部的模块（文件）文档字符串
- 类和函数/方法的文档字符串
- 非显而易见逻辑的段落/块注释

### 代码位置指南

- **模块（文件）文档字符串**：模块目的、边界、关键不变量和"陷阱"——新读者在编辑前必须了解的内容。
  - 包含到关键协作者（模块/服务）的交叉链接，以便发现。
  - 优先记录稳定的事实（不变量、契约），而非临时的"今天我们..."注释。
- **类文档字符串**：职责、生命周期、不变量，以及如何使用（或不使用）。
  - 如果类有状态，说明存在什么状态以及哪些方法会修改它。
  - 如果并发/异步假设很重要，请明确说明。
- **函数/方法文档字符串**：行为契约。
  - 记录参数、返回值形状、副作用（数据库写入、外部 I/O、任务调度）和引发的领域异常。
  - 仅在能防止误用时添加示例。
- **段落/块注释**：解释*为什么*（权衡、历史约束、令人惊讶的边界情况），而不是代码已经说明的*是什么*。
  - 保持注释与它们解释的逻辑相邻；删除或重写不再符合现实的注释。

### 规则（必须遵守）

本节中，"注释"指模块/类/函数文档字符串以及相关的段落/块注释。

- **开始工作前**
  - 阅读你要修改区域的注释；将它们视为规范的一部分。
  - 如果文档字符串或注释与当前代码冲突，将**代码作为唯一的真实来源**，并更新文档字符串或注释以匹配现实。
  - 如果缺少重要的意图/不变量/边界情况，在最近的文档字符串或注释中添加（模块用于整体范围，函数用于行为）。
- **工作中**
  - 在发现约束、做出决策或更改方法时保持注释同步。
  - 如果你在模块/类之间移动/重命名职责，更新受影响的文档字符串和注释，以便读者仍能找到"为什么"和不变量。
  - 在最近的文档字符串或注释中记录非显而易见的边界情况、权衡和测试/验证计划。
  - 保持注释**连贯**：将新发现整合到相关的文档字符串和注释中；避免追加式的"最近修复"/变更日志风格的添加。
- **完成时**
  - 更新注释以反映更改了什么、为什么以及任何新的边界情况/测试。
  - 删除或重写任何可能被误认为当前指导但不再适用的注释。
  - 保持文档字符串和注释简洁准确；它们旨在防止重复发现。

## 代码风格

这是本仓库后端代码的默认标准。新代码遵循此标准，并在审查更改时用作检查清单。

### 代码检查与格式化

- 使用 Ruff 进行格式化和代码检查（遵循 `ruff.toml`）。
- 每行保持在 120 字符以内（包括空格）。

### 命名约定

- 变量和函数使用 `snake_case`。
- 类使用 `PascalCase`。
- 常量使用 `UPPER_CASE`。

### 类型注解与类布局

- 代码通常应包含与仓库当前 Python 版本匹配的类型注解（避免无类型的公共 API 和"神秘"值）。
- 优先使用现代类型形式（如 `list[str]`, `dict[str, int]`），除非有充分理由否则避免使用 `Any`。
- 对于类，在类体顶部声明成员变量（在 `__init__` 之前），以便类形状一目了然：

```python
from datetime import datetime


class Example:
    user_id: str
    created_at: datetime

    def __init__(self, user_id: str, created_at: datetime) -> None:
        self.user_id = user_id
        self.created_at = created_at
```

### 通用规则

- 使用 Pydantic v2 约定。
- 本仓库使用 `uv` 进行 Python 包管理（通常使用 `--project api`）。
- 对于轻量级辅助功能，优先使用简单函数而非小型"工具类"。
- 除非明显需要且符合现有模式，否则避免实现双下方法。
- 永远不要作为 AI 助手工作的一部分启动长时间运行的服务（`uv run app.py`, `flask run` 等）；允许运行测试。
- 文件保持在约 800 行以下；必要时拆分。
- 保持代码可读和显式——避免聪明的技巧。

### 架构与边界

- 遵循分层架构：Controller → Service → Repository → Model
- 在创建新抽象之前复用 `services/`、`repositories/` 和 `utils/` 中的现有辅助功能。
- 优化可观察性：确定性控制流、清晰日志、可操作的错误。

### 日志与错误

- 永远不要使用 `print`；使用模块级日志记录器：
  - `logger = logging.getLogger(__name__)`
- 相关时在日志上下文中包含租户/应用/工作流标识符。
- 引发领域特定异常（`services/errors`, `core/errors`）并在控制器中转换为 HTTP 响应。
- 可重试事件在 `warning` 级别记录，终端失败在 `error` 级别记录。

### SQLAlchemy 模式

- 模型继承自 `models.base.Base`；不要创建临时元数据或引擎。
- 使用上下文管理器打开会话：

```python
from sqlalchemy.orm import Session

with Session(db.engine, expire_on_commit=False) as session:
    stmt = select(Lease).where(
        Lease.id == lease_id,
        Lease.organization_id == organization_id,
    )
    lease = session.execute(stmt).scalar_one_or_none()
```

- 优先使用 SQLAlchemy 表达式；除非必要否则避免原始 SQL。
- 始终按 `organization_id` 限定查询范围，并使用保护措施（`FOR UPDATE`、行计数等）保护写入路径。
- 仅对非常大的表（例如工作流执行）或需要替代存储策略时引入仓储抽象。

### Pydantic 使用

- 使用 Pydantic v2 模型定义 DTO，默认禁止额外字段。
- 使用 `@field_validator` / `@model_validator` 进行领域规则验证。

示例：

```python
from pydantic import BaseModel, ConfigDict, field_validator


class LeaseCreate(BaseModel):
    room_id: int
    tenant_id: int
    start_date: date
    end_date: date
    monthly_rent: float

    model_config = ConfigDict(extra="forbid")

    @field_validator("end_date")
    @classmethod
    def end_date_after_start_date(cls, v: date, info) -> date:
        if "start_date" in info.data and v <= info.data["start_date"]:
            raise ValueError("结束日期必须在开始日期之后")
        return v
```

### 泛型与协议

- 使用 `typing.Protocol` 定义行为契约（例如缓存接口）。
- 对可复用工具（如缓存或提供者）应用泛型（`TypeVar`, `Generic`）。
- 当泛型无法单独强制安全时，在运行时验证动态输入。

### 工具与检查

迭代时的快速检查：

- 格式化：`make format`
- 代码检查（包括自动修复）：`make lint`
- 类型检查：`make type-check`
- 针对性测试：`make test`

打开 PR / 提交前：

- `make lint`
- `make type-check`
- `make test`

### 控制器与服务

- **控制器**：通过 Pydantic 解析输入，调用服务，返回序列化响应；不包含业务逻辑。
- **服务**：协调仓储、提供者、后台任务；保持副作用显式。
- 使用简洁的文档字符串和注释记录非显而易见的行为。

### 其他

- 使用 `configs.settings` 获取配置——永远不要直接读取环境变量。
- 端到端保持租户感知；`organization_id` 必须流经接触共享资源的每一层。
- 将实验性脚本放在 `dev/` 下；不要在生产构建中发布它们。

## 项目结构

```
api/
├── app/
│   ├── main.py              # 应用入口点
│   ├── configs/             # 配置管理
│   │   ├── settings.py      # 主设置
│   │   └── database.py      # 数据库配置
│   ├── controllers/         # API 控制器
│   │   ├── console/         # 业务 API
│   │   │   ├── auth.py      # 认证
│   │   │   ├── organizations.py  # 组织管理
│   │   │   ├── apartments.py     # 公寓管理
│   │   │   ├── tenants.py        # 租客管理
│   │   │   ├── leases.py         # 租约管理
│   │   │   ├── utilities.py      # 水电读数
│   │   │   ├── bills.py          # 账单管理
│   │   │   └── reports.py        # 报表统计
│   │   └── common/          # 共享组件
│   │       ├── deps.py      # 依赖注入
│   │       ├── errors.py    # 错误处理
│   │       └── responses.py # 响应格式
│   ├── services/            # 业务逻辑层
│   │   ├── auth_service.py
│   │   ├── apartment_service.py
│   │   ├── tenant_service.py
│   │   ├── lease_service.py
│   │   ├── bill_service.py
│   │   └── ...
│   ├── repositories/        # 数据访问层
│   ├── models/              # SQLAlchemy ORM 模型
│   ├── schemas/             # Pydantic 模型
│   └── utils/               # 工具函数
├── migrations/              # Alembic 迁移
├── tests/                   # 测试文件
├── pyproject.toml           # 项目配置
└── ruff.toml               # Ruff 配置
```

## 多租户

所有业务实体都有 `organization_id` 用于数据隔离。用户通过 `organization_members` 属于组织，具有以下角色：
- `owner` - 完全访问 + 账单管理
- `admin` - 完全访问
- `member` - 读写操作
- `viewer` - 只读访问

### 关键业务逻辑

**租约管理** (`api/app/services/lease_service.py`):
- 创建租约前验证房间可用性
- 检查与现有租约的日期重叠
- 创建/终止租约时更新房间状态

**账单生成** (`api/app/services/bill_service.py`):
- 从仪表读数计算水电费用
- 支持为所有活跃租约批量生成
- 生成 PDF/Excel 导出

## 常用命令

```bash
# 开发
make dev-api         # 启动 API 服务器

# 代码质量
make format          # 格式化代码
make check           # 检查代码
make lint            # 修复代码问题
make type-check      # 类型检查
make test            # 运行测试

# 数据库
make migrate         # 运行迁移
make migrate-create  # 创建新迁移
make db-reset        # 重置数据库
```

## 访问地址

- API 文档 (Swagger): http://localhost:8000/docs
- API 文档 (ReDoc): http://localhost:8000/redoc
