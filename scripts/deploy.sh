#!/bin/bash
# ============================================
# PropEase Docker 部署脚本
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env.production"
DOCKER_COMPOSE_FILE="$PROJECT_ROOT/docker/docker-compose.yaml"

# 解析命令行参数
SKIP_BACKUP=false
SKIP_PRE_CHECK=false
ONLY_MIGRATE=false

usage() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --skip-backup      跳过数据库备份"
    echo "  --skip-pre-check   跳过部署前检查"
    echo "  --only-migrate     仅运行数据库迁移"
    echo "  -h, --help         显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0                 # 完整部署"
    echo "  $0 --skip-backup   # 跳过备份直接部署"
}

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --skip-pre-check)
            SKIP_PRE_CHECK=true
            shift
            ;;
        --only-migrate)
            ONLY_MIGRATE=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "未知选项: $1"
            usage
            exit 1
            ;;
    esac
done

echo "============================================"
echo "  PropEase Docker 部署"
echo "============================================"
echo ""

# 加载环境变量
if [ -f "$ENV_FILE" ]; then
    echo "加载环境变量: $ENV_FILE"
    set -a
    source "$ENV_FILE"
    set +a
else
    echo "错误: 未找到环境变量文件: $ENV_FILE"
    echo "请先运行: ./scripts/setup-env.sh"
    exit 1
fi

# 设置镜像标签
export API_IMAGE_TAG="${API_IMAGE_TAG:-latest}"
export TENANT_WEB_IMAGE_TAG="${TENANT_WEB_IMAGE_TAG:-latest}"
export ADMIN_WEB_IMAGE_TAG="${ADMIN_WEB_IMAGE_TAG:-latest}"

# 部署前检查
if [ "$SKIP_PRE_CHECK" = false ]; then
    echo ""
    echo "--------------------------------------------"
    echo "  运行部署前检查..."
    echo "--------------------------------------------"
    if [ -x "$SCRIPT_DIR/pre-deploy-check.sh" ]; then
        "$SCRIPT_DIR/pre-deploy-check.sh"
    else
        echo "警告: 部署前检查脚本不存在，跳过"
    fi
fi

# 数据库备份
if [ "$SKIP_BACKUP" = false ]; then
    echo ""
    echo "--------------------------------------------"
    echo "  数据库备份..."
    echo "--------------------------------------------"
    if [ -x "$SCRIPT_DIR/backup.sh" ]; then
        "$SCRIPT_DIR/backup.sh"
    else
        echo "警告: 备份脚本不存在，跳过备份"
    fi
fi

# 仅迁移模式
if [ "$ONLY_MIGRATE" = true ]; then
    echo ""
    echo "--------------------------------------------"
    echo "  运行数据库迁移..."
    echo "--------------------------------------------"
    docker compose \
        -f "$DOCKER_COMPOSE_FILE" \
        --env-file "$ENV_FILE" \
        run --rm api \
        sh -c "npx prisma migrate deploy"
    echo "数据库迁移完成"
    exit 0
fi

# 停止旧容器
echo ""
echo "--------------------------------------------"
echo "  停止旧容器..."
echo "--------------------------------------------"
docker compose \
    -f "$DOCKER_COMPOSE_FILE" \
    --env-file "$ENV_FILE" \
    down --remove-orphans

# 拉取最新镜像（如果有远程镜像）
echo ""
echo "--------------------------------------------"
echo "  拉取镜像..."
echo "--------------------------------------------"
docker compose \
    -f "$DOCKER_COMPOSE_FILE" \
    --env-file "$ENV_FILE" \
    pull || echo "  镜像拉取失败或超时，将使用本地镜像"

# 启动服务
echo ""
echo "--------------------------------------------"
echo "  启动服务..."
echo "--------------------------------------------"
docker compose \
    -f "$DOCKER_COMPOSE_FILE" \
    --env-file "$ENV_FILE" \
    up -d

# 等待服务健康
echo ""
echo "--------------------------------------------"
echo "  等待服务启动..."
echo "--------------------------------------------"
sleep 10

# 验证部署
echo ""
echo "--------------------------------------------"
echo "  验证部署状态..."
echo "--------------------------------------------"
if [ -x "$SCRIPT_DIR/verify-production.sh" ]; then
    "$SCRIPT_DIR/verify-production.sh"
else
    echo "验证脚本不存在，尝试基本验证..."

    # 检查容器状态
    echo ""
    echo "容器状态:"
    docker compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" ps

    # 健康检查
    echo ""
    echo "API 健康检查:"
    curl -s http://localhost:8000/health || echo "API 尚未就绪"

    echo ""
    echo "租客端检查:"
    curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "租客端尚未就绪"

    echo ""
    echo "运营后台检查:"
    curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 || echo "运营后台尚未就绪"
fi

echo ""
echo "============================================"
echo "  部署完成!"
echo "============================================"
echo ""
echo "访问地址:"
echo "  租客端:   http://${SERVER_NAME:-localhost}"
echo "  运营后台: http://${SERVER_NAME:-localhost}/admin"
echo "  API:      http://${SERVER_NAME:-localhost}/api/v1"
echo ""
