# Apartment Ultra 运营后台生产环境 Dockerfile
# 构建上下文为 monorepo 根目录

# ============================================
# Stage 1: 依赖安装
# ============================================
FROM node:20-alpine AS deps
WORKDIR /app

# 配置 pnpm 使用国内镜像
RUN corepack enable pnpm && pnpm config set registry https://registry.npmmirror.com

# 复制 workspace 配置
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY tsconfig.base.json tsconfig.base.json
COPY tsconfig.nextjs.json tsconfig.nextjs.json
COPY tsconfig.react-package.json tsconfig.react-package.json
COPY api/package.json api/package.json
COPY admin-web/package.json admin-web/package.json
COPY packages/ packages/

# 安装依赖
RUN pnpm install --no-frozen-lockfile

# ============================================
# Stage 2: 构建
# ============================================
FROM node:20-alpine AS builder
WORKDIR /app

# 配置 pnpm 使用国内镜像
RUN corepack enable pnpm && pnpm config set registry https://registry.npmmirror.com

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/api/node_modules ./api/node_modules
COPY --from=deps /app/admin-web/node_modules ./admin-web/node_modules
COPY --from=deps /app/packages ./packages

# 复制源代码
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY tsconfig.base.json tsconfig.base.json
COPY tsconfig.nextjs.json tsconfig.nextjs.json
COPY tsconfig.react-package.json tsconfig.react-package.json
COPY api/package.json api/package.json
COPY admin-web/package.json admin-web/package.json
COPY packages/ packages/
COPY api/src api/src
COPY api/prisma api/prisma
COPY api/tsconfig.json api/
COPY admin-web/src admin-web/src
COPY admin-web/next.config.mjs admin-web/
COPY admin-web/tsconfig.json admin-web/
COPY admin-web/tailwind.config.ts admin-web/
COPY admin-web/postcss.config.mjs admin-web/

# 构建 api-contract
RUN corepack enable pnpm && pnpm --filter @apartment-ultra/api-contract run build

# 构建运营后台（环境变量在构建时注入）
WORKDIR /app/admin-web
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build

# ============================================
# Stage 3: 生产运行
# ============================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder --chown=nextjs:nodejs /app/admin-web/.next/standalone/ ./
COPY --from=builder --chown=nextjs:nodejs /app/admin-web/.next/static ./admin-web/.next/static

USER nextjs

EXPOSE 3001

ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

CMD ["node", "admin-web/server.js"]
