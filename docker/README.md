# Docker 部署

## 环境说明

| 文件 | 用途 |
|------|------|
| `docker-compose.yaml` | 本地生产/联调环境 |
| `docker-compose.dev.yaml` | 开发环境（支持热重载） |
| `docker-compose.prod.yaml` | 云服务器生产环境 |
| `docker-compose.middleware.yaml` | 本地中间件（PostgreSQL、Redis） |

## 快速启动

```bash
# 开发环境
docker compose -f docker-compose.dev.yaml up

# 生产环境（本地）
docker compose -f docker-compose.yaml up -d

# 云服务器生产环境
docker compose -f docker-compose.prod.yaml --env-file .env.production up -d
```

---

## 环境变量配置

### 部署所需环境变量

| 变量 | 说明 | 示例 |
|------|------|------|
| `DEPLOY_HOST` | 服务器 IP 或域名 | `192.168.1.1` |
| `DEPLOY_USER` | SSH 用户名 | `root`（默认） |

### 生产环境变量（.env.production）

| 变量 | 说明 | 生成方式 |
|------|------|---------|
| `POSTGRES_PASSWORD` | 数据库密码 | `openssl rand -base64 32` |
| `SECRET_KEY` | JWT 签名密钥 | `openssl rand -hex 64` |
| `CORS_ORIGINS` | 允许的前端来源 | `["http://${DEPLOY_HOST}"]` |
| `NEXT_PUBLIC_API_URL` | API 地址 | `http://${DEPLOY_HOST}/api/v1` |
| `SERVER_NAME` | Nginx server_name | `${DEPLOY_HOST}` |
| `ADMIN_INIT_PASSWORD` | 管理员初始密码 | 自定义强密码 |

---

## 本地构建部署（推荐）

### 首次部署

**1. 服务器环境准备（Ubuntu 22.04）**

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Docker（国内服务器使用阿里云镜像）
curl -fsSL https://get.docker.com | sudo sh -s -- --mirror Aliyun

# 启动并设置开机自启
sudo systemctl start docker
sudo systemctl enable docker

# 配置 Docker 镜像加速（国内服务器必选）
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<EOF
{
  "registry-mirrors": ["https://docker.1ms.run", "https://docker.xuanyuan.me"]
}
EOF
sudo systemctl daemon-reload && sudo systemctl restart docker

# 验证安装
docker --version
```

**2. 本地配置环境变量**

```bash
# 在项目根目录创建 .env.production
cp docker/.env.production.example .env.production
```

编辑 `.env.production`，配置以下内容（替换 `${DEPLOY_HOST}` 为服务器地址）：

```bash
# 数据库
POSTGRES_PASSWORD=<生成的数据库密码>

# 安全
SECRET_KEY=<生成的JWT密钥>

# 访问控制
CORS_ORIGINS=["http://${DEPLOY_HOST}"]
NEXT_PUBLIC_API_URL=http://${DEPLOY_HOST}/api/v1

# Nginx
SERVER_NAME=${DEPLOY_HOST}

# 管理员
ADMIN_INIT_PASSWORD=<管理员初始密码>
```

**3. 一键部署**

```bash
# 设置服务器地址后执行
DEPLOY_HOST=<服务器地址> ./scripts/deploy-from-local.sh
```

该脚本会自动完成：构建镜像 → 上传镜像和配置文件 → 远程启动服务（包含 Nginx）

**4. 验证部署**

```bash
# 健康检查
curl http://${DEPLOY_HOST}/health

# 浏览器访问
http://${DEPLOY_HOST}
```

### 后续更新

每次代码更新后，重新执行一键部署：

```bash
DEPLOY_HOST=<服务器地址> ./scripts/deploy-from-local.sh
```

### 手动分步操作

```bash
# 1. 构建
./scripts/build-local.sh

# 2. 上传文件
scp dist/*.tar.gz ${DEPLOY_USER:-root}@${DEPLOY_HOST}:/tmp/
scp docker/docker-compose.prod.yaml ${DEPLOY_USER:-root}@${DEPLOY_HOST}:/opt/apartment-ultra/docker/
scp docker/nginx.conf.template ${DEPLOY_USER:-root}@${DEPLOY_HOST}:/opt/apartment-ultra/docker/
scp scripts/deploy-images.sh ${DEPLOY_USER:-root}@${DEPLOY_HOST}:/opt/apartment-ultra/scripts/
scp .env.production ${DEPLOY_USER:-root}@${DEPLOY_HOST}:/opt/apartment-ultra/

# 3. 服务器执行
ssh ${DEPLOY_USER:-root}@${DEPLOY_HOST} "cd /opt/apartment-ultra && chmod +x scripts/deploy-images.sh && ./scripts/deploy-images.sh"
```

---

## 脚本说明

| 脚本 | 用途 | 执行位置 |
|------|------|---------|
| `build-local.sh` | 构建 Docker 镜像 | 本地 |
| `deploy-from-local.sh` | 一键部署 | 本地 |
| `deploy-images.sh` | 加载镜像并启动服务 | 服务器 |
| `backup.sh` | 数据库备份 | 服务器 |

---

## 架构说明

```
┌─────────────────────────────────────────┐
│           Nginx (Docker :80)            │
├──────────────────┬──────────────────────┤
│   Web (Next.js)  │   API (Express)      │
│      :3000       │       :8000          │
├──────────────────┴──────────────────────┤
│            PostgreSQL :5432             │
│              Redis :6379                │
└─────────────────────────────────────────┘
```

所有服务都在 Docker 网络中运行，Nginx 对外暴露 80 端口。

---

## 常用命令

```bash
# 查看日志
docker compose -f docker/docker-compose.prod.yaml --env-file .env.production logs -f

# 查看特定服务日志
docker compose -f docker/docker-compose.prod.yaml --env-file .env.production logs -f api

# 重启服务
docker compose -f docker/docker-compose.prod.yaml --env-file .env.production restart

# 查看状态
docker compose -f docker/docker-compose.prod.yaml --env-file .env.production ps

# 停止服务
docker compose -f docker/docker-compose.prod.yaml --env-file .env.production down
```

---

## 常见问题

### Docker 镜像拉取超时

配置国内镜像加速，编辑 `/etc/docker/daemon.json`：

```json
{
  "registry-mirrors": [
    "https://docker.1ms.run",
    "https://docker.xuanyuan.me"
  ]
}
```

备用镜像源：
- `https://dockerhub.icu`
- `https://hub.rat.dev`
- `https://docker.hlyun.org`

### 502 Bad Gateway

检查服务状态：

```bash
docker compose -f docker/docker-compose.prod.yaml --env-file .env.production ps
docker compose -f docker/docker-compose.prod.yaml --env-file .env.production logs api
docker compose -f docker/docker-compose.prod.yaml --env-file .env.production logs web
```

### Docker 安装失败（国内服务器）

```bash
# 使用阿里云镜像安装
curl -fsSL https://get.docker.com | sudo sh -s -- --mirror Aliyun

# 或手动安装
sudo apt update
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release
curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://mirrors.aliyun.com/docker-ce/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo systemctl start docker
sudo systemctl enable docker
```

### 端口被占用

如果服务器 80 端口被占用，修改 `docker-compose.prod.yaml` 中 nginx 的端口映射：

```yaml
nginx:
  ports:
    - "8080:80"  # 改为其他端口
```
