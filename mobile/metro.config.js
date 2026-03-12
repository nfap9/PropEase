const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 添加 .mjs 扩展名支持
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs'];

// 确保 ES 模块被正确解析
config.resolver.unstable_enablePackageExports = true;

// 强制使用 react-native 条件解析，避免使用 ESM 版本
config.resolver.unstable_conditionNames = [
  'react-native',
  'browser',
  'require',
  'main',
  'default',
];

// 禁用 ESM import 条件，避免加载 esm/*.mjs 文件
// 这样 zustand 会使用 commonjs 版本

module.exports = config;
