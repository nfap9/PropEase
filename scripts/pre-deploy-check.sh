#!/bin/bash
# ============================================
# 部署前检查脚本
# 用法: ./scripts/pre-deploy-check.sh [--env-file .env.production]
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
DIM='\033[2m'
NC='\033[0m'

# 默认环境文件
ENV_FILE="${1:-.env.production}"
if [[ "$1" == "--env-file" ]]; then
    ENV_FILE="$2"
fi

echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}          ${1}部署前检查${NC}                      ${CYAN}║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

ERRORS=0
WARNINGS=0

# 检查结果记录
check_pass() {
    echo -e "  ${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "  ${RED}✗${NC} $1"
    ERRORS=$((ERRORS + 1))
}

check_warn() {
    echo -e "  ${YELLOW}!${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

# ============================================
# 1. 检查环境变量文件
# ============================================
echo -e "${DIM}▶ 检查环境配置${NC}"

if [ -f "$ENV_FILE" ]; then
    check_pass "环境文件 $ENV_FILE 存在"
else
    check_fail "环境文件 $ENV_FILE 不存在"
    echo -e "  ${DIM}提示: 复制 docker/.env.production.example 为 $ENV_FILE${NC}"
    exit 1
fi

# 加载环境变量
set -a
source "$ENV_FILE"
set +a

# ============================================
# 2. 检查必要环境变量
# ============================================
echo ""
echo -e "${DIM}▶ 检查必要环境变量${NC}"

REQUIRED_VARS=(
    "POSTGRES_PASSWORD:数据库密码"
    "SECRET_KEY:JWT密钥"
    "CORS_ORIGINS:跨域配置"
    "NEXT_PUBLIC_API_URL:API地址"
)

for var_def in "${REQUIRED_VARS[@]}"; do
    var_name="${var_def%%:*}"
    var_desc="${var_def#*:}"
    if [ -n "${!var_name}" ]; then
        # 检查是否是默认值
        case "$var_name" in
            "SECRET_KEY")
                if [ "${!var_name}" = "dev-secret-key-do-not-use-in-production" ]; then
                    check_fail "$var_desc 使用了开发默认值"
                else
                    check_pass "$var_desc 已配置"
                fi
                ;;
            *)
                check_pass "$var_desc 已配置"
                ;;
        esac
    else
        check_fail "$var_desc ($var_name) 未设置"
    fi
done

# ============================================
# 3. 检查 Docker 环境
# ============================================
echo ""
echo -e "${DIM}▶ 检查 Docker 环境${NC}"

if command -v docker &> /dev/null; then
    check_pass "Docker 已安装"
    if docker info &> /dev/null; then
        check_pass "Docker 服务运行中"
    else
        check_fail "Docker 服务未运行"
    fi
else
    check_fail "Docker 未安装"
fi

if command -v docker &> /dev/null && docker buildx version &> /dev/null; then
    check_pass "Docker Buildx 可用"
else
    check_warn "Docker Buildx 不可用，跨平台构建可能失败"
fi

# ============================================
# 4. 检查必要文件
# ============================================
echo ""
echo -e "${DIM}▶ 检查必要文件${NC}"

REQUIRED_FILES=(
    "api/Dockerfile:API Dockerfile"
    "tenant-web/Dockerfile.prod:租客端前端 Dockerfile"
    "admin-web/Dockerfile.prod:运营后台前端 Dockerfile"
    "docker/docker-compose.yaml:Docker Compose 配置"
    "docker/nginx.conf.template:Nginx 配置"
    "api/prisma/schema.prisma:Prisma Schema"
)

for file_def in "${REQUIRED_FILES[@]}"; do
    file_path="${file_def%%:*}"
    file_desc="${file_def#*:}"
    if [ -f "$file_path" ]; then
        check_pass "$file_desc 存在"
    else
        check_fail "$file_desc 不存在 ($file_path)"
    fi
done

# ============================================
# 5. 检查 TypeScript 编译
# ============================================
echo ""
echo -e "${DIM}▶ 检查代码质量${NC}"

echo -n "  检查 API TypeScript... "
if pnpm --filter apartment-ultra-api exec tsc --noEmit 2>/dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo -n "  检查 Web TypeScript... "
if pnpm --filter apartment-ultra-web exec tsc --noEmit 2>/dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    ERRORS=$((ERRORS + 1))
fi

# ============================================
# 6. 检查 URL 配置
# ============================================
echo ""
echo -e "${DIM}▶ 检查 URL 配置${NC}"

if [ -n "$NEXT_PUBLIC_API_URL" ]; then
    if [[ "$NEXT_PUBLIC_API_URL" == http://localhost* ]] || [[ "$NEXT_PUBLIC_API_URL" == http://127.* ]]; then
        check_warn "NEXT_PUBLIC_API_URL 使用本地地址，生产环境应使用服务器地址"
    else
        check_pass "NEXT_PUBLIC_API_URL 格式正确"
    fi
fi

if [ -n "$CORS_ORIGINS" ]; then
    check_pass "CORS_ORIGINS 已配置"
else
    check_fail "CORS_ORIGINS 未配置"
fi

# ============================================
# 7. 汇总结果
# ============================================
echo ""
echo -e "${DIM}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}发现 $ERRORS 个错误，$WARNINGS 个警告${NC}"
    echo -e "${DIM}请修复错误后再部署${NC}"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}检查通过，但有 $WARNINGS 个警告${NC}"
    echo -e "${DIM}建议处理警告后再部署${NC}"
    exit 0
else
    echo -e "${GREEN}所有检查通过！${NC}"
    exit 0
fi
