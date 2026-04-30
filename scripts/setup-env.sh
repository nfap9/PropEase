#!/bin/bash
# ============================================
# PropEase 环境变量设置脚本
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env.production"
EXAMPLE_FILE="$PROJECT_ROOT/docker/.env.production.example"

echo "============================================"
echo "  PropEase 环境变量设置向导"
echo "============================================"
echo ""

# 检查示例文件是否存在
if [ ! -f "$EXAMPLE_FILE" ]; then
    echo "错误: 找不到环境变量示例文件: $EXAMPLE_FILE"
    exit 1
fi

# 如果已存在 .env.production，询问是否备份
if [ -f "$ENV_FILE" ]; then
    echo "检测到已存在的环境变量文件: $ENV_FILE"
    read -p "是否备份现有文件? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        BACKUP_FILE="$ENV_FILE.backup.$(date +%Y%m%d%H%M%S)"
        cp "$ENV_FILE" "$BACKUP_FILE"
        echo "已备份到: $BACKUP_FILE"
    fi
fi

# 复制示例文件
cp "$EXAMPLE_FILE" "$ENV_FILE"
echo "已创建环境变量文件: $ENV_FILE"
echo ""

# 交互式设置必填项
echo "============================================"
echo "  请设置以下必填项:"
echo "============================================"

# SECRET_KEY
echo ""
echo "1. SECRET_KEY (JWT 签名密钥)"
echo "   - 推荐使用 32 位以上的随机字符串"
read -p "   请输入 SECRET_KEY (或按 Enter 生成随机值): " SECRET_KEY
if [ -z "$SECRET_KEY" ]; then
    SECRET_KEY=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 48)
    echo "   已生成随机密钥"
fi

# CORS_ORIGINS
echo ""
echo "2. CORS_ORIGINS (允许的跨域来源)"
echo "   - 多个地址用逗号分隔"
echo "   - 示例: http://localhost,https://your-domain.com"
read -p "   请输入 CORS_ORIGINS: " CORS_ORIGINS

# VITE_API_URL
echo ""
echo "3. VITE_API_URL (前端 API 地址)"
echo "   - 生产环境应为你的域名: https://your-domain.com/api/v1"
read -p "   请输入 VITE_API_URL: " VITE_API_URL

# POSTGRES_PASSWORD
echo ""
echo "4. POSTGRES_PASSWORD (数据库密码)"
read -p "   请输入 POSTGRES_PASSWORD: " POSTGRES_PASSWORD

# SERVER_NAME
echo ""
echo "5. SERVER_NAME (服务器域名)"
read -p "   请输入 SERVER_NAME (如: your-domain.com): " SERVER_NAME

# 更新环境变量文件
echo ""
echo "============================================"
echo "  更新环境变量文件..."
echo "============================================"

# 使用 sed 更新必填项
sed -i.bak "s|your-jwt-secret-key|${SECRET_KEY}|g" "$ENV_FILE"
sed -i.bak "s|your-secure-password|${POSTGRES_PASSWORD}|g" "$ENV_FILE"
sed -i.bak "s|\"http://your-domain.com\"|\"${CORS_ORIGINS}\"|g" "$ENV_FILE"
sed -i.bak "s|http://your-domain.com/api/v1|${VITE_API_URL}|g" "$ENV_FILE"
sed -i.bak "s|your-domain.com|${SERVER_NAME}|g" "$ENV_FILE"

# 移除备份文件
rm -f "$ENV_FILE.bak"

# 设置文件权限
chmod 600 "$ENV_FILE"

echo ""
echo "============================================"
echo "  环境变量设置完成!"
echo "============================================"
echo ""
echo "下一步:"
echo "  1. 检查并编辑: $ENV_FILE"
echo "  2. 运行构建脚本: ./scripts/build-images.sh"
echo "  3. 运行部署脚本: ./scripts/deploy.sh"
echo ""
