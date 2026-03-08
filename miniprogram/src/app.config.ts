export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/auth/login/index',
    'pages/utilities/list/index',
    'pages/bills/list/index',
    'pages/notifications/list/index',
  ],
  subPackages: [
    {
      root: 'pagesSub/auth',
      pages: ['register/index'],
    },
    {
      root: 'pagesSub/utilities',
      pages: ['input/index', 'history/index'],
    },
    {
      root: 'pagesSub/bills',
      pages: ['detail/index', 'payment/index'],
    },
    {
      root: 'pagesSub/rooms',
      pages: ['list/index', 'detail/index'],
    },
    {
      root: 'pagesSub/leases',
      pages: ['list/index', 'create/index', 'terminate/index'],
    },
    {
      root: 'pagesSub/tenants',
      pages: ['list/index', 'edit/index'],
    },
    {
      root: 'pagesSub/settings',
      pages: ['profile/index'],
    },
  ],
  preloadRule: {
    'pages/index/index': {
      network: 'all',
      packages: ['pagesSub/rooms', 'pagesSub/leases'],
    },
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '公寓管理',
    navigationBarTextStyle: 'black',
  },
  // TODO: 添加图标文件后启用 TabBar
  // 图标文件路径: src/assets/icons/
  // 需要的图标: home.png, home-active.png, water.png, water-active.png, bill.png, bill-active.png, user.png, user-active.png
  // tabBar: {
  //   color: '#999999',
  //   selectedColor: '#1890ff',
  //   backgroundColor: '#ffffff',
  //   borderStyle: 'black',
  //   list: [
  //     {
  //       pagePath: 'pages/index/index',
  //       text: '首页',
  //       iconPath: 'assets/icons/home.png',
  //       selectedIconPath: 'assets/icons/home-active.png',
  //     },
  //     {
  //       pagePath: 'pages/utilities/list/index',
  //       text: '水电',
  //       iconPath: 'assets/icons/water.png',
  //       selectedIconPath: 'assets/icons/water-active.png',
  //     },
  //     {
  //       pagePath: 'pages/bills/list/index',
  //       text: '账单',
  //       iconPath: 'assets/icons/bill.png',
  //       selectedIconPath: 'assets/icons/bill-active.png',
  //     },
  //     {
  //       pagePath: 'pages/settings/index/index',
  //       text: '我的',
  //       iconPath: 'assets/icons/user.png',
  //       selectedIconPath: 'assets/icons/user-active.png',
  //     },
  //   ],
  // },
  lazyCodeLoading: 'requiredComponents',
});
