#!/bin/bash
# =========================================
# Apartment Ultra 一键部署脚本
# =========================================
# 使用方法: DEPLOY_HOST=<ip> ./scripts/deploy.sh
#
# 环境变量:
#   DEPLOY_HOST      - 服务器 IP 或域名 (必需)
#   DEPLOY_USER      - 服务器用户名 (默认: root)
#   DEPLOY_DIR       - 部署目录 (默认: /opt/apartment-ultra)
#   SKIP_BUILD       - 跳过构建，使用现有 dist/ 中的镜像
# =========================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

# 配置
SERVER_USER="${DEPLOY_USER:-root}"
REMOTE_DIR="${DEPLOY_DIR:-/opt/apartment-ultra}"

# 镜像文件名
API_IMAGE="api.tar.gz"
TENANT_WEB_IMAGE="tenant-web.tar.gz"
ADMIN_WEB_IMAGE="admin-web.tar.gz"

# 计时器
START_TIME=0

start_timer() {
    START_TIME=$(date +%s)
}

end_timer() {
    local end_time=$(date +%s)
    local duration=$((end_time - START_TIME))
    local minutes=$((duration / 60))
    local seconds=$((duration % 60))
    if [ $minutes -gt 0 ]; then
        echo -e "${DIM}   耗时 ${minutes}分${seconds}秒${NC}"
    else
        echo -e "${DIM}   耗时 ${seconds}秒${NC}"
    fi
}

# 打印函数
print_banner() {
    clear
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}          ${BOLD}Apartment Ultra 部署工具${NC}                      ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_header() {
    local title=$1
    echo ""
    echo -e "${BOLD}${BLUE}▶ $title${NC}"
    echo -e "${DIM}  ─────────────────────────────────────────${NC}"
}

print_task() {
    echo -ne "  ${DIM}•${NC} $1... "
}

print_done() {
    echo -e "${GREEN}完成${NC}"
}

print_fail() {
    echo -e "${RED}失败${NC}"
}

print_info() {
    echo -e "  ${CYAN}→${NC} $1"
}

print_sub() {
    echo -e "${DIM}    $1${NC}"
}

show_spinner() {
    local pid=$1
    local msg=$2
    local spin='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
    local i=0
    while kill -0 $pid 2>/dev/null; do
        i=$(( (i+1) % ${#spin} ))
        echo -ne "\r  ${CYAN}${spin:$i:1}${NC} $msg  "
        sleep 0.1
    done
    echo -ne "\r"
}

# 检查服务器地址
if [ -z "$DEPLOY_HOST" ] && [ -f ".env.production" ]; then
    DEPLOY_HOST=$(grep "^SERVER_NAME=" .env.production | cut -d'=' -f2-)
fi

if [ -z "$DEPLOY_HOST" ]; then
    print_banner
    echo -e "  ${RED}✗ 请设置服务器地址${NC}"
    echo ""
    echo -e "  用法: ${BOLD}DEPLOY_HOST=<ip> ./scripts/deploy.sh${NC}"
    exit 1
fi

SERVER_HOST="$DEPLOY_HOST"
SSH_DEST="${SERVER_USER}@${SERVER_HOST}"

if [ ! -f ".env.production" ]; then
    print_banner
    echo -e "  ${RED}✗ .env.production 不存在${NC}"
    echo -e "  请先运行: ${BOLD}./scripts/setup-env.sh${NC}"
    exit 1
fi

start_timer
print_banner

echo -e "  ${BOLD}服务器:${NC} ${SERVER_USER}@${SERVER_HOST}"
echo -e "  ${BOLD}目录:${NC}   ${REMOTE_DIR}"

# ========================================
# 步骤 1: 检查服务器
# ========================================
print_header "检查服务器环境"

print_task "连接服务器"
if ssh -o ConnectTimeout=5 -o BatchMode=yes ${SSH_DEST} "echo ok" &>/dev/null; then
    print_done
else
    print_fail
    echo -e "  ${RED}无法连接服务器，请检查 SSH 配置${NC}"
    exit 1
fi

print_task "检查 Docker"
if ssh ${SSH_DEST} "command -v docker &> /dev/null"; then
    DOCKER_VERSION=$(ssh ${SSH_DEST} "docker --version" | cut -d' ' -f3 | tr -d ',')
    print_done
    print_sub "Docker 版本: ${DOCKER_VERSION}"
else
    echo -e "${YELLOW}需要安装${NC}"
    print_info "正在安装 Docker..."
    ssh ${SSH_DEST} << 'REMOTE_SCRIPT'
apt update -qq 2>/dev/null
curl -fsSL https://get.docker.com | sh -s -- --mirror Aliyun >/dev/null 2>&1
mkdir -p /etc/docker
echo '{"registry-mirrors": ["https://docker.1ms.run"]}' > /etc/docker/daemon.json
systemctl daemon-reload && systemctl start docker && systemctl enable docker >/dev/null 2>&1
REMOTE_SCRIPT
    print_done
fi

# ========================================
# 步骤 2: 构建镜像
# ========================================
if [ "$SKIP_BUILD" != "true" ]; then
    print_header "构建 Docker 镜像"

    echo -e "  ${DIM}构建平台: linux/amd64${NC}"
    echo ""

    API_URL=$(grep "^NEXT_PUBLIC_API_URL=" .env.production | cut -d'=' -f2-)

    # 构建 API
    print_task "构建 API 镜像"
    echo ""
    if docker buildx build --platform linux/amd64 --load -f api/Dockerfile -t apartment-ultra-api:latest . 2>&1 | while IFS= read -r line; do
        echo -e "  ${DIM}$line${NC}"
    done; then
        echo ""
        print_done
    else
        echo ""
        print_fail
        exit 1
    fi

    # 构建租客端前端
    print_task "构建租客端前端镜像"
    echo ""
    if docker buildx build --platform linux/amd64 --load -f tenant-web/Dockerfile.prod --build-arg NEXT_PUBLIC_API_URL=${API_URL} -t apartment-ultra-tenant-web:latest . 2>&1 | while IFS= read -r line; do
        echo -e "  ${DIM}$line${NC}"
    done; then
        echo ""
        print_done
    else
        echo ""
        print_fail
        exit 1
    fi

    # 构建运营后台前端
    print_task "构建运营后台前端镜像"
    echo ""
    if docker buildx build --platform linux/amd64 --load -f admin-web/Dockerfile.prod --build-arg NEXT_PUBLIC_API_URL=${API_URL} -t apartment-ultra-admin-web:latest . 2>&1 | while IFS= read -r line; do
        echo -e "  ${DIM}$line${NC}"
    done; then
        echo ""
        print_done
    else
        echo ""
        print_fail
        exit 1
    fi

    # 保存镜像
    print_task "导出镜像文件"
    mkdir -p dist
    docker save apartment-ultra-api:latest | gzip > dist/${API_IMAGE} &
    docker save apartment-ultra-tenant-web:latest | gzip > dist/${TENANT_WEB_IMAGE} &
    docker save apartment-ultra-admin-web:latest | gzip > dist/${ADMIN_WEB_IMAGE} &
    wait
    print_done

    API_SIZE=$(ls -lh dist/${API_IMAGE} | awk '{print $5}')
    TENANT_SIZE=$(ls -lh dist/${TENANT_WEB_IMAGE} | awk '{print $5}')
    ADMIN_SIZE=$(ls -lh dist/${ADMIN_WEB_IMAGE} | awk '{print $5}')
    print_sub "api: ${API_SIZE}, tenant-web: ${TENANT_SIZE}, admin-web: ${ADMIN_SIZE}"
fi

# ========================================
# 步骤 3: 上传文件
# ========================================
print_header "上传文件到服务器"

ssh ${SSH_DEST} "mkdir -p ${REMOTE_DIR}/docker ${REMOTE_DIR}/scripts" 2>/dev/null

# 获取文件大小
API_SIZE=$(ls -lh dist/${API_IMAGE} 2>/dev/null | awk '{print $5}' || echo "?")
TENANT_SIZE=$(ls -lh dist/${TENANT_WEB_IMAGE} 2>/dev/null | awk '{print $5}' || echo "?")
ADMIN_SIZE=$(ls -lh dist/${ADMIN_WEB_IMAGE} 2>/dev/null | awk '{print $5}' || echo "?")

# 上传镜像
print_task "上传 API 镜像 (${API_SIZE})"
scp -o ConnectTimeout=30 dist/${API_IMAGE} ${SSH_DEST}:/tmp/ &
UPLOAD_PID=$!
show_spinner $UPLOAD_PID "上传中"
wait $UPLOAD_PID
print_done

print_task "上传租客端前端镜像 (${TENANT_SIZE})"
scp -o ConnectTimeout=30 dist/${TENANT_WEB_IMAGE} ${SSH_DEST}:/tmp/ &
UPLOAD_PID=$!
show_spinner $UPLOAD_PID "上传中"
wait $UPLOAD_PID
print_done

print_task "上传运营后台前端镜像 (${ADMIN_SIZE})"
scp -o ConnectTimeout=30 dist/${ADMIN_WEB_IMAGE} ${SSH_DEST}:/tmp/ &
UPLOAD_PID=$!
show_spinner $UPLOAD_PID "上传中"
wait $UPLOAD_PID
print_done

# 上传配置
print_task "上传配置文件"
scp -q docker/docker-compose.yaml ${SSH_DEST}:${REMOTE_DIR}/docker/
scp -q docker/nginx.conf.template ${SSH_DEST}:${REMOTE_DIR}/docker/
scp -q .env.production ${SSH_DEST}:${REMOTE_DIR}/
print_done

# ========================================
# 步骤 4: 启动服务
# ========================================
print_header "启动服务"

print_task "加载镜像"
LOAD_LOG=$(mktemp)
if ssh ${SSH_DEST} "docker load < /tmp/${API_IMAGE} && docker load < /tmp/${TENANT_WEB_IMAGE} && docker load < /tmp/${ADMIN_WEB_IMAGE}" >"$LOAD_LOG" 2>&1; then
    print_done
else
    print_fail
    echo -e "  ${RED}加载失败，错误日志:${NC}"
    cat "$LOAD_LOG" | sed 's/^/  /'
    rm -f "$LOAD_LOG"
    exit 1
fi
rm -f "$LOAD_LOG"

print_task "启动容器"
DEPLOY_LOG=$(mktemp)
if ssh ${SSH_DEST} << 'REMOTE_SCRIPT' >"$DEPLOY_LOG" 2>&1
cd /opt/apartment-ultra
docker compose -f docker/docker-compose.yaml --env-file .env.production pull postgres redis nginx 2>/dev/null || true
docker compose -f docker/docker-compose.yaml --env-file .env.production up -d
REMOTE_SCRIPT
then
    print_done
else
    print_fail
    echo -e "  ${RED}启动失败，错误日志:${NC}"
    cat "$DEPLOY_LOG" | sed 's/^/  /'
    rm -f "$DEPLOY_LOG"
    exit 1
fi
rm -f "$DEPLOY_LOG"

# ========================================
# 步骤 5: 健康检查
# ========================================
print_header "健康检查"

print_task "等待服务就绪"
for i in {1..30}; do
    HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://${SERVER_HOST}/health 2>/dev/null || echo "000")
    if [ "$HEALTH" = "200" ]; then
        break
    fi
    echo -ne "\r  ${DIM}等待中... ${i}/30${NC}  "
    sleep 1
done
echo -ne "\r"

if [ "$HEALTH" = "200" ]; then
    echo -e "${GREEN}  ✓ 服务正常运行${NC}"
else
    echo -e "${YELLOW}  ! 服务可能未完全启动${NC}"
fi

# ========================================
# 完成
# ========================================
echo ""
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ "$HEALTH" = "200" ]; then
    echo -e "  ${GREEN}✓${NC} ${BOLD}部署成功!${NC}"
else
    echo -e "  ${YELLOW}!${NC} ${BOLD}部署完成${NC} (请检查服务状态)"
fi

end_timer

echo ""
echo -e "  ${BOLD}访问地址:${NC}"
echo -e "  ${CYAN}→${NC} http://${SERVER_HOST}"
echo -e "  ${CYAN}→${NC} http://${SERVER_HOST}/admin"
echo -e "  ${CYAN}→${NC} http://${SERVER_HOST}/health"
echo ""
echo -e "  ${BOLD}查看日志:${NC}"
echo -e "  ${DIM}ssh ${SERVER_USER}@${SERVER_HOST} \"docker logs -f apartment_ultra_api\"${NC}"
echo ""
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
