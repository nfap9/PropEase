/* eslint-env node */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: false,
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'error',
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          // utils 层：只允许依赖 lib, constants, types
          {
            target: './src/utils',
            from: './src/services',
            message: '工具层 (utils) 不能依赖业务层 (services)',
          },
          {
            target: './src/utils',
            from: './src/repositories',
            message: '工具层 (utils) 不能依赖数据层 (repositories)',
          },
          {
            target: './src/utils',
            from: './src/routes',
            message: '工具层 (utils) 不能依赖路由层 (routes)',
          },
          {
            target: './src/utils',
            from: './src/middlewares',
            message: '工具层 (utils) 不能依赖中间件层 (middlewares)',
          },
          // lib 层：只允许依赖 constants, types
          {
            target: './src/lib',
            from: './src/services',
            message: 'lib 层不能依赖业务层 (services)',
          },
          {
            target: './src/lib',
            from: './src/repositories',
            message: 'lib 层不能依赖数据层 (repositories)',
          },
          {
            target: './src/lib',
            from: './src/routes',
            message: 'lib 层不能依赖路由层 (routes)',
          },
          {
            target: './src/lib',
            from: './src/middlewares',
            message: 'lib 层不能依赖中间件层 (middlewares)',
          },
          {
            target: './src/lib',
            from: './src/utils',
            message: 'lib 层不能依赖工具层 (utils)',
          },
          // constants 层：只允许依赖 types
          {
            target: './src/constants',
            from: './src/services',
            message: '常量层 (constants) 不能依赖业务层 (services)',
          },
          {
            target: './src/constants',
            from: './src/repositories',
            message: '常量层 (constants) 不能依赖数据层 (repositories)',
          },
          {
            target: './src/constants',
            from: './src/routes',
            message: '常量层 (constants) 不能依赖路由层 (routes)',
          },
          {
            target: './src/constants',
            from: './src/middlewares',
            message: '常量层 (constants) 不能依赖中间件层 (middlewares)',
          },
          {
            target: './src/constants',
            from: './src/utils',
            message: '常量层 (constants) 不能依赖工具层 (utils)',
          },
          {
            target: './src/constants',
            from: './src/lib',
            message: '常量层 (constants) 不能依赖 lib 层',
          },
          // types 层：只允许依赖 constants
          {
            target: './src/types',
            from: './src/services',
            message: '类型层 (types) 不能依赖业务层 (services)',
          },
          {
            target: './src/types',
            from: './src/repositories',
            message: '类型层 (types) 不能依赖数据层 (repositories)',
          },
          {
            target: './src/types',
            from: './src/routes',
            message: '类型层 (types) 不能依赖路由层 (routes)',
          },
          {
            target: './src/types',
            from: './src/middlewares',
            message: '类型层 (types) 不能依赖中间件层 (middlewares)',
          },
          {
            target: './src/types',
            from: './src/utils',
            message: '类型层 (types) 不能依赖工具层 (utils)',
          },
          {
            target: './src/types',
            from: './src/lib',
            message: '类型层 (types) 不能依赖 lib 层',
          },
          // repositories 层：只允许依赖 lib, constants, types
          {
            target: './src/repositories',
            from: './src/services',
            message: '数据层 (repositories) 不能依赖业务层 (services)',
          },
          {
            target: './src/repositories',
            from: './src/routes',
            message: '数据层 (repositories) 不能依赖路由层 (routes)',
          },
          {
            target: './src/repositories',
            from: './src/middlewares',
            message: '数据层 (repositories) 不能依赖中间件层 (middlewares)',
          },
          // services 层：只允许依赖 repositories, lib, constants, types, utils
          {
            target: './src/services',
            from: './src/routes',
            message: '业务层 (services) 不能依赖路由层 (routes)',
          },
          {
            target: './src/services',
            from: './src/middlewares',
            message: '业务层 (services) 不能依赖中间件层 (middlewares)',
          },
        ],
      },
    ],
  },
  env: { node: true, es2022: true },
  ignorePatterns: ['dist', 'node_modules'],
  overrides: [
    {
      files: ['**/*.test.ts'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-function-type': 'off',
        'import/no-restricted-paths': 'off',
      },
    },
  ],
};
