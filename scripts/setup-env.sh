#!/bin/bash
# =========================================
# 初始化生产环境配置
# =========================================
# 使用方法: ./scripts/setup-env.sh
# 会自动生成 .env.production 文件
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

ENV_FILE=".env.production"

# 检查是否已存在
if [ -f "$ENV_FILE" ]; then
    log_warn "$ENV_FILE 已存在"
    read -p "是否覆盖? (y/N): " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        log_info "已取消"
        exit 0
    fi
fi

log_info "开始生成 $ENV_FILE..."

# 获取服务器地址
read -p "请输入服务器 IP 或域名: " SERVER_ADDR
if [ -z "$SERVER_ADDR" ]; then
    log_error "服务器地址不能为空"
    exit 1
fi

# 生成密钥
log_info "生成密钥..."
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d '/+=')
SECRET_KEY=$(openssl rand -hex 64)

# 写入配置文件
cat > $ENV_FILE << EOF
# =========================================
# Apartment Ultra 生产环境配置
# 自动生成于 $(date '+%Y-%m-%d %H:%M:%S')
# =========================================

# ---- 数据库配置 ----
POSTGRES_USER=apartment_admin
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=apartment_ultra

# ---- API 配置 ----
APP_NAME=Apartment Ultra API
SECRET_KEY=${SECRET_KEY}
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# ---- CORS 配置 ----
CORS_ORIGINS=["http://${SERVER_ADDR}"]

# ---- 前端配置 ----
VITE_API_URL=http://${SERVER_ADDR}/api/v1

# ---- Nginx 配置 ----
SERVER_NAME=${SERVER_ADDR}

# ---- 微信支付配置（可选）----
WECHAT_PAY_ENABLED=false

# ---- 镜像标签 ----
API_IMAGE_TAG=latest
TENANT_WEB_IMAGE_TAG=latest
ADMIN_WEB_IMAGE_TAG=latest
EOF

chmod 600 $ENV_FILE

log_info "配置文件已生成: $ENV_FILE"
echo ""
echo "=========================================="
echo "重要信息请保存:"
echo "  数据库密码: $POSTGRES_PASSWORD"
echo "=========================================="
echo ""
log_info "现在可以执行部署:"
echo "  DEPLOY_HOST=${SERVER_ADDR} ./scripts/deploy.sh"
