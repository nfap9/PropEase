#!/bin/bash
# =========================================
# 本地构建并部署到服务器（一键部署）
# =========================================
# 使用方法: ./scripts/deploy-from-local.sh
# 环境变量:
#   DEPLOY_USER - SSH 用户名（默认 root）
#   DEPLOY_HOST - 服务器 IP（必填）
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

# 配置
SERVER_USER="${DEPLOY_USER:-root}"
SERVER_HOST="${DEPLOY_HOST:-}"

if [ -z "$SERVER_HOST" ]; then
    log_error "请设置服务器 IP: DEPLOY_HOST=<ip> ./scripts/deploy-from-local.sh"
    exit 1
fi

REMOTE_DIR="/opt/apartment-ultra"

# 步骤 1: 构建镜像
log_info "步骤 1/4: 构建 Docker 镜像..."
./scripts/build-local.sh

# 步骤 2: 上传镜像
log_info "步骤 2/4: 上传镜像到服务器..."
scp dist/*.tar.gz ${SERVER_USER}@${SERVER_HOST}:/tmp/

# 步骤 3: 上传配置文件
log_info "步骤 3/4: 上传配置文件..."
ssh ${SERVER_USER}@${SERVER_HOST} "mkdir -p ${REMOTE_DIR}/docker ${REMOTE_DIR}/scripts"
scp docker/docker-compose.prod.yaml ${SERVER_USER}@${SERVER_HOST}:${REMOTE_DIR}/docker/
scp scripts/deploy-images.sh ${SERVER_USER}@${SERVER_HOST}:${REMOTE_DIR}/scripts/

# 上传环境变量（如果本地有 .env.production）
if [ -f ".env.production" ]; then
    scp .env.production ${SERVER_USER}@${SERVER_HOST}:${REMOTE_DIR}/
fi

# 步骤 4: 远程部署
log_info "步骤 4/4: 在服务器上加载镜像并启动服务..."
ssh ${SERVER_USER}@${SERVER_HOST} "cd ${REMOTE_DIR} && chmod +x scripts/deploy-images.sh && ./scripts/deploy-images.sh"

log_info "部署完成!"
log_info "访问: http://${SERVER_HOST}"
