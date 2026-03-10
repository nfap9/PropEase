export default defineAppConfig({
  pages: [
    'pages/login/index',
    'pages/dashboard/index',
    'pages/apartments/index',
    'pages/apartments/detail/index',
    'pages/rooms/index',
    'pages/tenants/index',
    'pages/bills/index',
    'pages/settings/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FFFFFF',
    navigationBarTitleText: '公寓管理',
    navigationBarTextStyle: 'black',
    backgroundColor: '#F8FAFC',
  },
  tabBar: {
    color: '#94A3B8',
    selectedColor: '#2563EB',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/dashboard/index',
        text: '首页',
        icon: 'https://img.icons8.com/material-outlined/24/94A3B8/home.png',
        selectedIcon: 'https://img.icons8.com/material-outlined/24/2563EB/home.png',
      },
      {
        pagePath: 'pages/apartments/index',
        text: '房源',
        icon: 'https://img.icons8.com/material-outlined/24/94A3B8/building.png',
        selectedIcon: 'https://img.icons8.com/material-outlined/24/2563EB/building.png',
      },
      {
        pagePath: 'pages/tenants/index',
        text: '客户',
        icon: 'https://img.icons8.com/material-outlined/24/94A3B8/group.png',
        selectedIcon: 'https://img.icons8.com/material-outlined/24/2563EB/group.png',
      },
      {
        pagePath: 'pages/bills/index',
        text: '账单',
        icon: 'https://img.icons8.com/material-outlined/24/94A3B8/receipt.png',
        selectedIcon: 'https://img.icons8.com/material-outlined/24/2563EB/receipt.png',
      },
      {
        pagePath: 'pages/settings/index',
        text: '我的',
        icon: 'https://img.icons8.com/material-outlined/24/94A3B8/user.png',
        selectedIcon: 'https://img.icons8.com/material-outlined/24/2563EB/user.png',
      },
    ],
  },
  permission: {
    'scope.userLocation': {
      desc: '您的位置信息将用于小程序定位',
    },
  },
})
