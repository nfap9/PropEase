# 运维脚本

## deploy.sh

生产环境部署脚本，支持镜像构建、服务启动和选择性部署。

### 用法

```bash
./scripts/deploy.sh [选项]
```

### 选项

| 选项 | 说明 |
|------|------|
| `--skip-build` | 跳过镜像构建，仅重启服务 |
| `--api-only` | 仅构建并部署 API |
| `--web-only` | 仅构建并部署前端 |
| `-h, --help` | 显示帮助信息 |

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `ENV_FILE` | `docker/.env.production` | 环境变量文件路径 |

### 示例

```bash
# 完整部署
./scripts/deploy.sh

# 跳过镜像构建，仅重启服务
./scripts/deploy.sh --skip-build

# 仅部署前端
./scripts/deploy.sh --web-only
```

### 部署流程

1. 检查环境变量文件是否存在（默认 `docker/.env.production`，可从 `docker/.env.production.example` 复制）
2. 停止现有服务
3. 构建镜像（除非指定 `--skip-build`）
4. 启动服务
5. 等待服务就绪并验证健康检查
