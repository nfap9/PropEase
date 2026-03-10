const path = require('path')

const config = {
  projectName: 'miniprogram',
  date: '2024-3-10',
  designWidth: 375,
  deviceRatio: {
    375: 2 / 1,
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  framework: 'react',
  entry: {
    app: './src/index.tsx',
  },
  plugins: [
    '@tarojs/plugin-framework-react',
    '@tarojs/plugin-platform-weapp',
    '@tarojs/plugin-platform-h5',
  ],
  alias: {
    '@': path.resolve(__dirname, '../src'),
  },
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    prebundle: {
      enable: false,
    },
    htmlTemplate: path.resolve(__dirname, '../src/index.html'),
  },
}

module.exports = function (merge) {
  if (process.env.NODE_ENV === 'development') {
    return merge({}, config, require('./dev'))
  }
  return merge({}, config, require('./prod'))
}
