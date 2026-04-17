#!/bin/bash
# ============================================
# Apartment Ultra Docker 镜像构建脚本
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env.production"

# 默认镜像标签
API_IMAGE_TAG="${API_IMAGE_TAG:-latest}"
TENANT_WEB_IMAGE_TAG="${TENANT_WEB_IMAGE_TAG:-latest}"
ADMIN_WEB_IMAGE_TAG="${ADMIN_WEB_IMAGE_TAG:-latest}"

echo "============================================"
echo "  Apartment Ultra 镜像构建"
echo "============================================"
echo ""
echo "镜像标签:"
echo "  API:         apartment-ultra-api:${API_IMAGE_TAG}"
echo "  租客端:      apartment-ultra-tenant-web:${TENANT_WEB_IMAGE_TAG}"
echo "  运营后台:    apartment-ultra-admin-web:${ADMIN_WEB_IMAGE_TAG}"
echo ""

# 加载环境变量（如果存在）
if [ -f "$ENV_FILE" ]; then
    echo "加载环境变量: $ENV_FILE"
    set -a
    source "$ENV_FILE"
    set +a
else
    echo "警告: 未找到环境变量文件 ($ENV_FILE)"
    echo "将从环境变量读取配置"
fi

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "错误: Docker 未运行或当前用户没有 Docker 权限"
    exit 1
fi

# 构建 API 镜像
echo ""
echo "--------------------------------------------"
echo "  1/3 构建 API 镜像..."
echo "--------------------------------------------"
docker build \
    --build-arg DATABASE_URL="postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB:-apartment_ultra}" \
    -t "apartment-ultra-api:${API_IMAGE_TAG}" \
    -f "$PROJECT_ROOT/api/Dockerfile" \
    "$PROJECT_ROOT"

# 构建租客端镜像
echo ""
echo "--------------------------------------------"
echo "  2/3 构建租客端镜像..."
echo "--------------------------------------------"
docker build \
    --build-arg VITE_API_URL="${VITE_API_URL:-http://localhost/api/v1}" \
    -t "apartment-ultra-tenant-web:${TENANT_WEB_IMAGE_TAG}" \
    -f "$PROJECT_ROOT/tenant-web/Dockerfile" \
    "$PROJECT_ROOT"

# 构建运营后台镜像
echo ""
echo "--------------------------------------------"
echo "  3/3 构建运营后台镜像..."
echo "--------------------------------------------"
docker build \
    --build-arg VITE_API_URL="${VITE_API_URL:-http://localhost/api/v1}" \
    -t "apartment-ultra-admin-web:${ADMIN_WEB_IMAGE_TAG}" \
    -f "$PROJECT_ROOT/admin-web/Dockerfile" \
    "$PROJECT_ROOT"

echo ""
echo "============================================"
echo "  镜像构建完成!"
echo "============================================"
echo ""
echo "下一步:"
echo "  运行部署脚本: ./scripts/deploy.sh"
echo ""
