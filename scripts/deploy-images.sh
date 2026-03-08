#!/bin/bash
# =========================================
# 服务器端加载镜像并部署
# =========================================
# 在服务器上执行此脚本
# 使用方法: ./scripts/deploy-images.sh
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
COMPOSE_FILE="docker/docker-compose.server.yaml"
ENV_FILE=".env.production"

cd $PROJECT_DIR

# 检查镜像文件
if [ ! -f "/tmp/api.tar.gz" ]; then
    log_error "未找到 /tmp/api.tar.gz，请先上传镜像"
    exit 1
fi
if [ ! -f "/tmp/web.tar.gz" ]; then
    log_error "未找到 /tmp/web.tar.gz，请先上传镜像"
    exit 1
fi

# 检查环境变量文件
if [ ! -f "$ENV_FILE" ]; then
    log_error "环境变量文件 $ENV_FILE 不存在"
    log_info "请先创建: cp docker/.env.production.example .env.production"
    exit 1
fi

log_info "加载 Docker 镜像..."
docker load < /tmp/api.tar.gz
docker load < /tmp/web.tar.gz

log_info "拉取基础镜像（postgres, redis）..."
docker compose -f $COMPOSE_FILE --env-file $ENV_FILE pull postgres redis

log_info "启动服务..."
docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d

log_info "等待服务启动..."
sleep 5

log_info "检查服务状态..."
docker compose -f $COMPOSE_FILE --env-file $ENV_FILE ps

echo ""
log_info "部署完成!"
log_info "API: http://localhost:8000/api/v1/health"
log_info "Web: http://localhost:3000"
