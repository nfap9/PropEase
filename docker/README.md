# Docker 部署

## 环境说明

- **docker-compose.yaml** - 生产/联调环境
- **docker-compose.dev.yaml** - 开发环境（支持热重载）

## 快速启动

```bash
# 开发环境
docker compose -f docker-compose.dev.yaml up

# 生产环境
docker compose -f docker-compose.yaml up -d
```

## 生产环境配置

以下环境变量在生产环境中**必须覆盖默认值**：

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | PostgreSQL 连接串 |
| `SECRET_KEY` | JWT 签名密钥（强随机密钥） |
| `ADMIN_INIT_PASSWORD` | 运营后台管理员初始密码（部署后立即修改） |
| `CORS_ORIGINS` | 允许的前端来源（JSON 数组字符串） |

### 微信支付配置

如需启用微信支付，还需配置：

| 变量 | 说明 |
|------|------|
| `WECHAT_PAY_ENABLED` | 启用微信支付 |
| `WECHAT_MCH_ID` | 商户号 |
| `WECHAT_APP_ID` | 应用 ID |
| `WECHAT_APIV3_KEY` | API v3 密钥 |
| `WECHAT_CERT_SERIAL_NO` | 证书序列号 |
| `WECHAT_PAY_NOTIFY_URL_BASE` | 回调地址基础 URL |
| `WECHAT_PRIVATE_KEY` 或 `WECHAT_PRIVATE_KEY_PATH` | 私钥 |

详细配置见 [api/src/config.ts](../api/src/config.ts)。

## 架构说明

```
┌─────────────────────────────────────────┐
│              Nginx (80/443)             │
├──────────────────┬──────────────────────┤
│   Web (Next.js)  │   API (Express)      │
│      :3000       │       :8000          │
├──────────────────┴──────────────────────┤
│            PostgreSQL :5432             │
└─────────────────────────────────────────┘
```

## 常用命令

```bash
# 查看日志
docker compose -f docker-compose.yaml logs -f api
docker compose -f docker-compose.yaml logs -f web

# 重启服务
docker compose -f docker-compose.yaml restart api

# 进入容器
docker compose -f docker-compose.yaml exec api sh

# 停止并清理
docker compose -f docker-compose.yaml down
```
