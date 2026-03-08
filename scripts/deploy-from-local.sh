#!/bin/bash
# =========================================
# 本地构建并部署到服务器（一键部署）
# =========================================
# 使用方法:
#   ./scripts/deploy-from-local.sh              # 使用 .env.production 中的 SERVER_NAME
#   DEPLOY_HOST=<ip> ./scripts/deploy-from-local.sh  # 指定服务器地址
#
# 环境变量:
#   DEPLOY_USER - SSH 用户名（默认 root）
#   DEPLOY_HOST - 服务器 IP（必填或从 .env.production 读取）
# =========================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 配置
SERVER_USER="${DEPLOY_USER:-root}"
REMOTE_DIR="/opt/apartment-ultra"
SSH_HOST="${SERVER_USER}@${SERVER_HOST}"

# 从 .env.production 读取 SERVER_NAME 作为默认 DEPLOY_HOST
if [ -z "$DEPLOY_HOST" ] && [ -f ".env.production" ]; then
    DEPLOY_HOST=$(grep "^SERVER_NAME=" .env.production | cut -d'=' -f2-)
fi

if [ -z "$DEPLOY_HOST" ]; then
    log_error "请设置服务器地址:"
    log_error "  DEPLOY_HOST=<ip> ./scripts/deploy-from-local.sh"
    log_error "或在 .env.production 中配置 SERVER_NAME"
    exit 1
fi

SERVER_HOST="$DEPLOY_HOST"
SSH_DEST="${SERVER_USER}@${SERVER_HOST}"

# 检查 .env.production
if [ ! -f ".env.production" ]; then
    log_error ".env.production 不存在，请先运行:"
    log_error "  ./scripts/setup-env.sh"
    exit 1
fi

log_info "目标服务器: ${SSH_DEST}"

# 检测服务器是否安装 Docker
log_info "检查服务器环境..."
if ! ssh ${SSH_DEST} "command -v docker &> /dev/null"; then
    log_warn "服务器未安装 Docker，正在自动安装..."

    ssh ${SSH_DEST} << 'REMOTE_SCRIPT'
set -e
echo "[INFO] 更新系统..."
apt update -qq

echo "[INFO] 安装 Docker（使用阿里云镜像）..."
curl -fsSL https://get.docker.com | sh -s -- --mirror Aliyun

echo "[INFO] 配置 Docker 镜像加速..."
mkdir -p /etc/docker
cat > /etc/docker/daemon.json << 'EOF'
{
  "registry-mirrors": ["https://docker.1ms.run", "https://docker.xuanyuan.me"]
}
EOF
systemctl daemon-reload
systemctl start docker
systemctl enable docker

echo "[INFO] Docker 安装完成: $(docker --version)"
REMOTE_SCRIPT

    log_info "Docker 安装完成"
fi

# 步骤 1: 构建镜像
log_info "步骤 1/4: 构建 Docker 镜像..."
./scripts/build-local.sh

# 步骤 2: 上传镜像
log_info "步骤 2/4: 上传镜像到服务器..."
ssh ${SSH_DEST} "mkdir -p ${REMOTE_DIR}/docker ${REMOTE_DIR}/scripts"
scp dist/*.tar.gz ${SSH_DEST}:/tmp/

# 步骤 3: 上传配置文件
log_info "步骤 3/4: 上传配置文件..."
scp docker/docker-compose.prod.yaml ${SSH_DEST}:${REMOTE_DIR}/docker/
scp docker/nginx.conf.template ${SSH_DEST}:${REMOTE_DIR}/docker/
scp scripts/deploy-images.sh ${SSH_DEST}:${REMOTE_DIR}/scripts/
scp .env.production ${SSH_DEST}:${REMOTE_DIR}/

# 步骤 4: 远程部署
log_info "步骤 4/4: 在服务器上加载镜像并启动服务..."
ssh ${SSH_DEST} "cd ${REMOTE_DIR} && chmod +x scripts/deploy-images.sh && ./scripts/deploy-images.sh"

# 步骤 5: 健康检查
log_info "等待服务启动..."
sleep 10

log_info "健康检查..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://${SERVER_HOST}/health 2>/dev/null || echo "000")

if [ "$HEALTH_STATUS" = "200" ]; then
    log_info "部署成功!"
    echo ""
    echo "=========================================="
    log_info "访问地址: http://${SERVER_HOST}"
    log_info "健康检查: http://${SERVER_HOST}/health"
    echo "=========================================="
else
    log_warn "服务可能未完全启动，请手动检查:"
    log_warn "  curl http://${SERVER_HOST}/health"
fi
