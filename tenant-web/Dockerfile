# PropEase 租客端前端生产环境 Dockerfile
# 构建上下文为 monorepo 根目录

# ============================================
# Stage 1: 依赖安装
# ============================================
FROM node:20-alpine AS deps
WORKDIR /app

# 配置 pnpm
RUN corepack enable pnpm && pnpm config set registry https://registry.npmmirror.com

# 复制 workspace 配置
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY tsconfig.base.json tsconfig.base.json
COPY tsconfig.react-package.json tsconfig.react-package.json
COPY api/package.json api/package.json
COPY tenant-web/package.json tenant-web/package.json
COPY packages/ packages/

# 安装依赖
RUN pnpm install --no-frozen-lockfile

# ============================================
# Stage 2: 构建
# ============================================
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable pnpm && pnpm config set registry https://registry.npmmirror.com

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/api/node_modules ./api/node_modules
COPY --from=deps /app/tenant-web/node_modules ./tenant-web/node_modules
COPY --from=deps /app/packages ./packages

# 复制源代码
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY tsconfig.base.json tsconfig.base.json
COPY tsconfig.react-package.json tsconfig.react-package.json
COPY api/package.json api/package.json
COPY tenant-web/package.json tenant-web/package.json
COPY packages/ packages/
COPY api/src api/src
COPY api/prisma api/prisma
COPY api/tsconfig.json api/
COPY tenant-web/src tenant-web/src
COPY tenant-web/public tenant-web/public
COPY tenant-web/vite.config.ts tenant-web/
COPY tenant-web/tsconfig.json tenant-web/
COPY tenant-web/tailwind.config.ts tenant-web/
COPY tenant-web/postcss.config.mjs tenant-web/
COPY tenant-web/index.html tenant-web/

# 构建 api-contract
RUN pnpm --filter @propease/api-contract run build

# 构建前端
WORKDIR /app/tenant-web
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm run build

# ============================================
# Stage 3: 生产运行
# ============================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# 安装 serve 用于静态文件服务
RUN npm install -g serve@14

# 复制构建产物
COPY --from=builder /app/tenant-web/dist ./dist

EXPOSE 3000

# serve 会自动寻找 dist 目录
CMD ["serve", "-s", "dist", "-l", "3000"]
