# TabBar 图标

请将以下图标文件放入此目录：

- home.png (81x81) - 首页图标（未选中）
- home-active.png (81x81) - 首页图标（选中）
- water.png (81x81) - 水电图标（未选中）
- water-active.png (81x81) - 水电图标（选中）
- bill.png (81x81) - 账单图标（未选中）
- bill-active.png (81x81) - 账单图标（选中）
- user.png (81x81) - 我的图标（未选中）
- user-active.png (81x81) - 我的图标（选中）

## 图标要求

- 尺寸：81x81 像素
- 格式：PNG（支持透明背景）
- 未选中颜色：#999999
- 选中颜色：#1890ff

## 临时解决方案

在正式图标添加之前，可以在 app.config.ts 中暂时移除 iconPath 和 selectedIconPath 配置。
