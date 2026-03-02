# Build stage（构建上下文为 monorepo 根目录）
FROM node:20-alpine AS builder

WORKDIR /app

# 复制 workspace 根与各包（含 api-contract），使用单一 lockfile 安装
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY api/package.json api/package.json
COPY web/package.json web/package.json
COPY packages/ packages/
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# 复制 api 源码
COPY api/ api/
RUN pnpm --filter apartment-ultra-api exec prisma generate
RUN pnpm --filter apartment-ultra-api run build

# Production stage（复制整棵 /app 以保持 pnpm node_modules 符号链接）
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./

WORKDIR /app/api
EXPOSE 8000
CMD ["node", "dist/index.js"]
