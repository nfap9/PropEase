#!/bin/bash
# =========================================
# Apartment Ultra 一键部署脚本
# =========================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# 图标
CHECK="✓"
CROSS="✗"
ARROW="→"
GEAR="⚙"

# 配置
SERVER_USER="${DEPLOY_USER:-root}"
REMOTE_DIR="/opt/apartment-ultra"

# 工具函数
print_banner() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}      ${BOLD}Apartment Ultra 部署工具${NC}            ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    local step=$1
    local total=$2
    local desc=$3
    echo ""
    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}${BLUE}  步骤 ${step}/${total}: ${desc}${NC}"
    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_info() {
    echo -e "  ${CYAN}${ARROW}${NC} $1"
}

print_success() {
    echo -e "  ${GREEN}${CHECK}${NC} $1"
}

print_error() {
    echo -e "  ${RED}${CROSS}${NC} $1"
}

print_warning() {
    echo -e "  ${YELLOW}!${NC} $1"
}

print_progress() {
    echo -e "  ${GEAR} $1"
}

start_timer() {
    START_TIME=$(date +%s)
}

end_timer() {
    local end_time=$(date +%s)
    local duration=$((end_time - START_TIME))
    local minutes=$((duration / 60))
    local seconds=$((duration % 60))
    if [ $minutes -gt 0 ]; then
        echo -e "  ⏱  耗时: ${minutes}分${seconds}秒"
    else
        echo -e "  ⏱  耗时: ${seconds}秒"
    fi
}

# 从 .env.production 读取 SERVER_NAME 作为默认 DEPLOY_HOST
if [ -z "$DEPLOY_HOST" ] && [ -f ".env.production" ]; then
    DEPLOY_HOST=$(grep "^SERVER_NAME=" .env.production | cut -d'=' -f2-)
fi

if [ -z "$DEPLOY_HOST" ]; then
    print_banner
    print_error "请设置服务器地址"
    echo ""
    echo -e "  用法: ${BOLD}DEPLOY_HOST=<ip> ./scripts/deploy-from-local.sh${NC}"
    echo -e "  或在 ${BOLD}.env.production${NC} 中配置 SERVER_NAME"
    exit 1
fi

SERVER_HOST="$DEPLOY_HOST"
SSH_DEST="${SERVER_USER}@${SERVER_HOST}"

# 检查 .env.production
if [ ! -f ".env.production" ]; then
    print_banner
    print_error ".env.production 不存在"
    echo ""
    echo -e "  请先运行: ${BOLD}./scripts/setup-env.sh${NC}"
    exit 1
fi

start_timer
print_banner

echo -e "  ${BOLD}目标服务器:${NC} ${SERVER_USER}@${SERVER_HOST}"
echo -e "  ${BOLD}部署目录:${NC}   ${REMOTE_DIR}"
echo ""

# 检测服务器 Docker
print_step 1 5 "检查服务器环境"
print_progress "连接服务器..."

if ssh ${SSH_DEST} "command -v docker &> /dev/null"; then
    DOCKER_VERSION=$(ssh ${SSH_DEST} "docker --version" | cut -d' ' -f3 | tr -d ',')
    print_success "Docker 已安装 (v${DOCKER_VERSION})"
else
    print_warning "Docker 未安装，开始自动安装..."
    ssh ${SSH_DEST} << 'REMOTE_SCRIPT' 2>/dev/null
apt update -qq
curl -fsSL https://get.docker.com | sh -s -- --mirror Aliyun >/dev/null 2>&1
mkdir -p /etc/docker
cat > /etc/docker/daemon.json << 'EOF'
{"registry-mirrors": ["https://docker.1ms.run", "https://docker.xuanyuan.me"]}
EOF
systemctl daemon-reload && systemctl start docker && systemctl enable docker >/dev/null 2>&1
REMOTE_SCRIPT
    print_success "Docker 安装完成"
fi

# 构建镜像
print_step 2 5 "构建 Docker 镜像"
print_progress "构建 API 镜像 (linux/amd64)..."

BUILD_OUTPUT=$(./scripts/build-local.sh 2>&1)
if [ $? -eq 0 ]; then
    print_success "API 镜像构建完成"
    print_success "Web 镜像构建完成"
else
    print_error "构建失败"
    echo "$BUILD_OUTPUT"
    exit 1
fi

# 上传镜像
print_step 3 5 "上传镜像到服务器"
print_progress "上传 API 镜像 (267MB)..."
scp -q dist/api.tar.gz ${SSH_DEST}:/tmp/ && print_success "API 镜像上传完成"

print_progress "上传 Web 镜像 (53MB)..."
scp -q dist/web.tar.gz ${SSH_DEST}:/tmp/ && print_success "Web 镜像上传完成"

# 上传配置文件
print_step 4 5 "上传配置文件"
ssh ${SSH_DEST} "mkdir -p ${REMOTE_DIR}/docker ${REMOTE_DIR}/scripts" 2>/dev/null

print_progress "上传 docker-compose.prod.yaml..."
scp -q docker/docker-compose.prod.yaml ${SSH_DEST}:${REMOTE_DIR}/docker/ && print_success "完成"

print_progress "上传 nginx.conf.template..."
scp -q docker/nginx.conf.template ${SSH_DEST}:${REMOTE_DIR}/docker/ && print_success "完成"

print_progress "上传 deploy-images.sh..."
scp -q scripts/deploy-images.sh ${SSH_DEST}:${REMOTE_DIR}/scripts/ && print_success "完成"

print_progress "上传 .env.production..."
scp -q .env.production ${SSH_DEST}:${REMOTE_DIR}/ && print_success "完成"

# 远程部署
print_step 5 5 "启动服务"
print_progress "加载镜像..."
LOAD_OUTPUT=$(ssh ${SSH_DEST} "cd ${REMOTE_DIR} && chmod +x scripts/deploy-images.sh && ./scripts/deploy-images.sh" 2>&1)
if echo "$LOAD_OUTPUT" | grep -q "部署完成"; then
    print_success "镜像加载完成"
    print_success "服务启动完成"
else
    print_warning "服务启动中..."
fi

# 健康检查
print_progress "健康检查..."
sleep 10

HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://${SERVER_HOST}/health 2>/dev/null || echo "000")

echo ""
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ "$HEALTH_STATUS" = "200" ]; then
    echo -e "${GREEN}  ${CHECK}${NC} ${BOLD}部署成功!${NC}"
    end_timer
    echo ""
    echo -e "  ${BOLD}访问地址:${NC}"
    echo -e "  ${CYAN}→${NC} 网站: ${BOLD}http://${SERVER_HOST}${NC}"
    echo -e "  ${CYAN}→${NC} 健康检查: http://${SERVER_HOST}/health"
    echo ""
else
    echo -e "${YELLOW}  ! 部署完成，但服务可能未完全启动${NC}"
    end_timer
    echo ""
    echo -e "  手动检查命令:"
    echo -e "  ${CYAN}→${NC} ssh ${SERVER_USER}@${SERVER_HOST}"
    echo -e "  ${CYAN}→${NC} docker logs apartment_ultra_api"
fi

echo ""
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
