# 小程序开发指南

## AI 助手必读（必查）

在修改 `miniprogram/src/` 下的任何代码之前，**必须**阅读周围的注释和相关文件。这些注释包含必要的上下文（组件用途、数据流、状态管理）。

### 代码位置指南

- **页面配置注释**：页面标题、导航栏设置
- **复杂逻辑注释**：解释业务逻辑和数据处理
- **类型定义**：TypeScript 类型必须完整且准确

### 规则（必须遵守）

- **开始工作前**
  - 阅读你要修改区域的代码和注释
  - 理解页面/组件的职责边界
  - 检查相关 API 接口定义（复用 `@apartment-ultra/api-contract`）

- **工作中**
  - 所有页面要保证职责单一，能够拆分的功能使用独立的组件/hooks 实现
  - 复用现有 hooks 和工具函数
  - 保持类型定义同步

- **完成时**
  - 确保没有 TypeScript 错误
  - 确保没有 ESLint 警告
  - 验证 UI 显示正确的中文文本
  - 删除或重写任何可能被误认为当前指导但不再适用的注释

## 技术栈

- **框架**: Taro 3.6+ (支持多端编译)
- **语言**: TypeScript (strict mode)
- **UI 框架**: React 18
- **状态管理**: Zustand (轻量级)
- **数据获取**: TanStack Query
- **样式**: SCSS + CSS 变量

## 跨平台响应式布局

**核心原则**：使用 `px` 单位，Taro 编译时自动转换为各平台响应式单位。

### 设计稿基准

- 设计稿宽度：**750px**
- 配置：`config/index.ts` 中 `designWidth: 750`

### 单位转换规则

| 平台 | px 转换为 | 说明 |
|------|----------|------|
| 微信小程序 | rpx | 1rpx = 屏幕宽度 / 750 |
| H5 | rem | 基于根元素字体大小 |
| React Native | pt | 原机像素单位 |
| 支付宝/百度/字节小程序 | rpx | 各自的响应式单位 |

### 推荐尺寸（基于 750px 设计稿）

```scss
// 目标：在 iPhone 6/7/8 (375pt) 上显示合理尺寸
// 换算：1rpx = 0.5pt，所以 32px → 32rpx → 16pt

// 字体大小
--font-size-xs: 24px;   // → 12pt (辅助文字)
--font-size-sm: 28px;   // → 14pt (次要文字)
--font-size-base: 32px; // → 16pt (正文)
--font-size-lg: 36px;   // → 18pt (重要文字)
--font-size-xl: 40px;   // → 20pt (小标题)
--font-size-2xl: 48px;  // → 24pt (大标题)

// 间距
--spacing-xs: 20px;   // → 10pt
--spacing-sm: 28px;   // → 14pt
--spacing-md: 40px;   // → 20pt
--spacing-lg: 56px;   // → 28pt

// 组件高度（满足 iOS 44pt 最小点击区域）
// 按钮高度：100px → 50pt
// 输入框高度：100px → 50pt
```

### CSS 变量注意事项

**重要**：CSS 变量中的 `px` 值**会被** postcss-pxtransform 转换，可以放心使用。

```scss
// 推荐：在 app.scss 中定义全局变量
page {
  --font-size-base: 32px;  // 编译后: --font-size-base: 32rpx;
}

// 页面中使用
.text {
  font-size: var(--font-size-base);  // 正确：32rpx
}
```

## 代码风格

### 命名约定

与 API 及后端统一的规范见 [docs/naming-conventions.md](../../docs/naming-conventions.md)，摘要如下：

- 页面目录使用 `kebab-case`（如 `login/index.tsx`）
- 组件名使用 `PascalCase`（如 `LoginForm`）
- 类型/接口使用 `PascalCase`
- **与 API 一致的字段名使用 snake_case**（如 `full_name`、`organization_id`、`created_at`）
- 局部变量、函数参数使用 `camelCase`
- 常量使用 `UPPER_CASE`

### 页面结构

```tsx
// 1. 导入
import { View, Text, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import './index.scss';

// 2. 类型定义
interface FormData {
  phone: string;
  password: string;
}

// 3. 页面组件
export default function LoginPage() {
  // 3.1 Hooks
  const [form, setForm] = useState<FormData>({ phone: '', password: '' });
  const { login, loginLoading } = useAuth();

  // 3.2 事件处理
  const handleSubmit = () => {
    if (!form.phone.trim()) {
      Taro.showToast({ title: '请输入手机号', icon: 'none' });
      return;
    }
    login(form);
  };

  // 3.3 渲染
  return (
    <View className="login-page">
      {/* 页面内容 */}
    </View>
  );
}
```

### 类型规则

- 永远不要使用 `any` 类型
- 从 `@apartment-ultra/api-contract` 导入 API 类型
- 为所有状态定义类型

```tsx
// 好的做法
import type { User, LoginCredentials } from '@apartment-ultra/api-contract';

const [user, setUser] = useState<User | null>(null);

// 避免
const user: any = fetchData();
```

## 项目结构

```
miniprogram/
├── config/                     # Taro 配置
│   ├── index.ts                # 主配置（designWidth、pxtransform）
│   ├── dev.ts                  # 开发环境配置
│   └── prod.ts                 # 生产环境配置
├── src/
│   ├── app.config.ts           # 全局配置（页面路由、分包、TabBar）
│   ├── app.tsx                 # 入口组件
│   ├── app.scss                # 全局样式（CSS 变量）
│   │
│   ├── pages/                  # 主包页面（P0 核心功能）
│   │   ├── index/              # 首页仪表盘
│   │   ├── auth/               # 认证相关
│   │   │   └── login/
│   │   ├── utilities/          # 水电录入
│   │   │   └── list/
│   │   ├── bills/              # 账单管理
│   │   │   └── list/
│   │   ├── notifications/      # 通知中心
│   │   │   └── list/
│   │   └── settings/           # 设置
│   │       └── index/
│   │
│   ├── pagesSub/               # 分包页面（P1/P2 功能）
│   │   ├── auth/               # 注册等
│   │   │   └── register/
│   │   ├── rooms/              # 房间管理
│   │   ├── leases/             # 租约管理
│   │   ├── tenants/            # 租客管理
│   │   ├── utilities/          # 水电历史/录入
│   │   └── bills/              # 账单详情/支付
│   │
│   ├── lib/                    # 核心库
│   │   ├── api/                # API 客户端
│   │   │   ├── client.ts       # 请求封装（Token 自动刷新）
│   │   │   ├── auth.ts         # 认证 API
│   │   │   ├── bills.ts        # 账单 API
│   │   │   └── ...
│   │   ├── auth/               # 认证相关
│   │   │   └── store.ts        # Zustand 认证状态
│   │   └── storage/            # 本地存储
│   │
│   ├── hooks/                  # 自定义 Hooks
│   │   └── useAuth.ts          # 认证 Hook
│   │
│   └── types/                  # 类型定义
│       └── index.ts            # 重导出 api-contract 类型
│
├── package.json
├── tsconfig.json
└── project.config.json         # 微信小程序配置
```

## 分包策略

### 配置

```typescript
// src/app.config.ts
export default defineAppConfig({
  pages: [
    'pages/index/index',           // 主包
    'pages/auth/login/index',      // 主包
    'pages/utilities/list/index',  // 主包
    'pages/bills/list/index',      // 主包
  ],
  subPackages: [
    {
      root: 'pagesSub/auth',
      pages: ['register/index'],
    },
    {
      root: 'pagesSub/rooms',
      pages: ['list/index', 'detail/index'],
    },
    // ...
  ],
});
```

### 分包原则

- **主包**：P0 核心功能（登录、首页、水电、账单、通知）
- **分包**：P1/P2 功能（房间、租约、租客、设置详情）
- 主包体积控制在 2MB 以内

## API 客户端

### 请求封装

```tsx
// lib/api/client.ts
// 已实现：Token 自动携带、401 自动刷新、统一错误处理

import api from './client';

// 使用
const user = await api.get<User>('/auth/me');
await api.post('/auth/login', { phone, password });
```

### TanStack Query 使用

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api';

// 查询
function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: authApi.getMe,
    enabled: !!Taro.getStorageSync('access_token'),
  });
}

// 变更
function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: (data) => {
      Taro.setStorageSync('access_token', data.access_token);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      Taro.reLaunch({ url: '/pages/index/index' });
    },
  });
}
```

## 认证流程

### useAuth Hook

```tsx
import { useAuth } from '@/hooks/useAuth';

function Component() {
  const {
    user,           // 当前用户
    organization,   // 当前组织
    isLoading,      // 加载状态
    isAuthenticated,// 是否已登录
    login,          // 登录方法
    logout,         // 退出登录
  } = useAuth();

  if (isLoading) return <View>加载中...</View>;

  if (!isAuthenticated) {
    Taro.reLaunch({ url: '/pages/auth/login/index' });
    return null;
  }

  return <View>欢迎, {user?.full_name}</View>;
}
```

### 已登录检查

```tsx
// 在登录页检查是否已登录
useEffect(() => {
  if (isAuthenticated) {
    Taro.reLaunch({ url: '/pages/index/index' });
  }
}, [isAuthenticated]);
```

## 导航方式

**重要**：当前项目未配置 TabBar，使用 `Taro.reLaunch` 进行页面跳转。

```tsx
// 跳转到页面（关闭所有页面）
Taro.reLaunch({ url: '/pages/index/index' });

// 跳转到分包页面
Taro.navigateTo({ url: '/pagesSub/auth/register/index' });

// 返回上一页
Taro.navigateBack();
```

## 常用命令

```bash
# 开发（在项目根目录执行）
pnpm dev:weapp              # 启动微信小程序开发编译
pnpm build:weapp            # 构建微信小程序

# 在 miniprogram 目录执行
pnpm dev:weapp              # 同上
NODE_ENV=production pnpm build:weapp  # 生产构建

# 代码质量
pnpm lint                   # 运行 ESLint
pnpm lint:fix               # ESLint 并自动修复
```

## 常见问题

### 字体/组件太小？

确保使用正确的尺寸基准：
- 设计稿基于 750px
- 正文用 32px (→ 16pt)
- 按钮高度用 100px (→ 50pt)
- 参考 `app.scss` 中的 CSS 变量

### 如何添加新页面？

1. 在 `src/pages/` 或 `src/pagesSub/` 下创建目录
2. 创建 `index.tsx`、`index.scss`、`index.config.ts`
3. 在 `app.config.ts` 中注册页面路由
4. 如果是主包页面，添加到 `pages` 数组
5. 如果是分包页面，添加到对应的 `subPackages`

### 如何添加新 API 接口？

1. 在 `src/lib/api/` 下添加或更新模块
2. 使用 `@apartment-ultra/api-contract` 中的类型
3. 在 hooks 或组件中使用 TanStack Query

### 编译报错？

1. 检查 TypeScript 类型是否正确
2. 检查导入路径是否使用 `@/` 别名
3. 运行 `pnpm lint` 检查代码风格
4. 清理 dist 目录重新编译

## 开发服务器

- 微信小程序：用微信开发者工具打开 `miniprogram/dist` 目录
- API 地址配置：`config/dev.ts` 中的 `TARO_APP_API_URL`
