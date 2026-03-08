# Docker 部署

## 环境说明

- **docker-compose.yaml** - 生产/联调环境（本地开发）
- **docker-compose.dev.yaml** - 开发环境（支持热重载）
- **docker-compose.prod.yaml** - 云服务器生产环境

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

## 本地构建部署（推荐）

适用于服务器内存较小无法在服务器端构建镜像的场景。在本地构建 Docker 镜像，导出为 tar 文件后上传到服务器加载运行。

### 首次部署

**1. 服务器环境准备**

```bash
# 安装 Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo systemctl start docker && sudo systemctl enable docker

# 配置 Docker 镜像加速（国内服务器必选）
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<EOF
{
  "registry-mirrors": ["https://docker.1ms.run", "https://docker.xuanyuan.me"]
}
EOF
sudo systemctl daemon-reload && sudo systemctl restart docker

# 创建目录
sudo mkdir -p /opt/apartment-ultra && sudo chown $USER:$USER /opt/apartment-ultra
```

**2. 本地配置环境变量**

```bash
# 在项目根目录创建 .env.production
cp docker/.env.production.example .env.production
vim .env.production  # 配置必要的环境变量
```

**3. 一键部署**

```bash
# 设置服务器 IP 后执行
DEPLOY_HOST=<your-server-ip> ./scripts/deploy-from-local.sh
```

该脚本会自动完成：构建镜像 → 上传镜像和配置文件 → 远程启动服务

### 后续更新

每次代码更新后，重新执行一键部署命令即可：

```bash
DEPLOY_HOST=<your-server-ip> ./scripts/deploy-from-local.sh
```

### 手动分步操作（可选）

如需分步执行：

```bash
# 1. 构建
./scripts/build-local.sh

# 2. 上传文件
scp dist/*.tar.gz root@<your-server-ip>:/tmp/
scp docker/docker-compose.prod.yaml root@<your-server-ip>:/opt/apartment-ultra/docker/
scp scripts/deploy-images.sh root@<your-server-ip>:/opt/apartment-ultra/scripts/
scp .env.production root@<your-server-ip>:/opt/apartment-ultra/

# 3. 服务器执行
ssh root@<your-server-ip> "cd /opt/apartment-ultra && chmod +x scripts/deploy-images.sh && ./scripts/deploy-images.sh"
```

---

## 云服务器部署（服务器端构建）

### 1. 服务器环境准备（CentOS/RHEL）

```bash
# 更新系统
sudo yum update -y

# 安装 Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo systemctl start docker && sudo systemctl enable docker
sudo usermod -aG docker $USER

# 安装 Git 和 Nginx
sudo yum install -y git epel-release nginx
sudo systemctl start nginx && sudo systemctl enable nginx

# 配置防火墙
sudo firewall-cmd --permanent --add-port={22,80,443}/tcp
sudo firewall-cmd --reload

# 重新登录使 docker 组生效
exit
```

### 2. 配置 Docker 镜像加速（国内服务器必选）

```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<EOF
{
  "registry-mirrors": [
    "https://docker.1ms.run",
    "https://docker.xuanyuan.me"
  ]
}
EOF

sudo systemctl daemon-reload
sudo systemctl restart docker
```

备用镜像源（如上述不可用）：
- `https://dockerhub.icu`
- `https://hub.rat.dev`
- `https://docker.hlyun.org`

### 3. 克隆代码并配置

```bash
# 配置 GitHub SSH 密钥
ssh-keygen -t ed25519 -C "deploy@server"
cat ~/.ssh/id_ed25519.pub  # 添加到 GitHub → Settings → SSH Keys

# 克隆代码
sudo mkdir -p /opt/apartment-ultra && sudo chown $USER:$USER /opt/apartment-ultra
cd /opt && git clone git@github.com:<your-repo>/apartment-ultra.git apartment-ultra
cd apartment-ultra

# 配置环境变量
cp docker/.env.production.example .env.production
chmod 600 .env.production
vim .env.production

# 设置脚本权限
chmod +x scripts/*.sh
```

### 4. 启动服务

```bash
./scripts/deploy.sh start
```

### 5. 配置 Nginx 反向代理

```bash
sudo vim /etc/nginx/conf.d/apartment-ultra.conf
```

写入以下配置：

```nginx
upstream api_backend {
    server 127.0.0.1:8000;
}

upstream web_backend {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name <your-server-ip>;  # 替换为你的服务器 IP 或域名

    location /api/ {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 10M;
    }

    location /health {
        proxy_pass http://api_backend/api/v1/health;
        access_log off;
    }

    location / {
        proxy_pass http://web_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

启动 Nginx：

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### 6. 验证部署

```bash
# 健康检查
curl http://localhost:8000/api/v1/health

# 通过 Nginx 访问
curl http://<your-server-ip>/health
```

浏览器访问：`http://<your-server-ip>`

---

## 部署脚本

使用 `scripts/deploy.sh` 管理服务：

```bash
./scripts/deploy.sh start    # 首次部署
./scripts/deploy.sh update   # 更新部署
./scripts/deploy.sh stop     # 停止服务
./scripts/deploy.sh logs     # 查看日志
./scripts/deploy.sh status   # 查看状态
```

---

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
