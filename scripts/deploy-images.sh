#!/bin/bash
# =========================================
# 服务器端加载镜像并部署
# =========================================
# 在服务器上执行此脚本
# 使用方法: ./scripts/deploy-images.sh
#
# 前置条件:
#   1. 镜像文件已上传到 /tmp/ 目录
#      - api.tar.gz
#      - tenant-web.tar.gz
#      - admin-web.tar.gz
#   2. .env.production 文件已创建
# =========================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

PROJECT_DIR="/opt/apartment-ultra"
COMPOSE_FILE="docker/docker-compose.yaml"
ENV_FILE=".env.production"

# 镜像文件
API_IMAGE="/tmp/api.tar.gz"
TENANT_WEB_IMAGE="/tmp/tenant-web.tar.gz"
ADMIN_WEB_IMAGE="/tmp/admin-web.tar.gz"

cd $PROJECT_DIR

# 检查镜像文件
log_info "检查镜像文件..."
MISSING_FILES=""

if [ ! -f "$API_IMAGE" ]; then
    log_error "未找到 ${API_IMAGE}"
    MISSING_FILES="${MISSING_FILES} api"
fi
if [ ! -f "$TENANT_WEB_IMAGE" ]; then
    log_error "未找到 ${TENANT_WEB_IMAGE}"
    MISSING_FILES="${MISSING_FILES} tenant-web"
fi
if [ ! -f "$ADMIN_WEB_IMAGE" ]; then
    log_error "未找到 ${ADMIN_WEB_IMAGE}"
    MISSING_FILES="${MISSING_FILES} admin-web"
fi

if [ -n "$MISSING_FILES" ]; then
    log_error "请先上传缺失的镜像文件到 /tmp/ 目录"
    exit 1
fi

# 检查环境变量文件
if [ ! -f "$ENV_FILE" ]; then
    log_error "环境变量文件 $ENV_FILE 不存在"
    log_info "请先创建: cp docker/.env.production.example .env.production"
    exit 1
fi

# 加载镜像
log_info "加载 Docker 镜像..."
docker load < $API_IMAGE
docker load < $TENANT_WEB_IMAGE
docker load < $ADMIN_WEB_IMAGE

# 拉取基础镜像
log_info "拉取基础镜像（postgres, redis, nginx）..."
docker compose -f $COMPOSE_FILE --env-file $ENV_FILE pull postgres redis nginx 2>/dev/null || true

# 启动服务
log_info "启动服务..."
docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d

# 等待服务启动
log_info "等待服务启动..."
sleep 5

# 检查服务状态
log_info "检查服务状态..."
docker compose -f $COMPOSE_FILE --env-file $ENV_FILE ps

echo ""
log_info "部署完成!"
echo ""
echo "访问地址:"
echo "  - 前端: http://localhost"
echo "  - 后台: http://localhost/admin"
echo "  - API:  http://localhost/api/v1"
echo "  - 健康检查: http://localhost/health"
