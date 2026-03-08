import { Component, PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './lib/auth/store';
import './app.scss';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2分钟内认为数据新鲜
      gcTime: 5 * 60 * 1000, // 5分钟后垃圾回收
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

class App extends Component<PropsWithChildren> {
  componentDidMount() {
    // 小程序启动时检查登录状态
    this.checkAuth();
  }

  checkAuth = async () => {
    const { setUser, setOrganization, setOrganizations } = useAuthStore.getState();
    // 初始化逻辑将在登录页面处理
  };

  // 独立页面分享配置
  onShareAppMessage() {
    return {
      title: '公寓管理',
      path: '/pages/index/index',
    };
  }

  render() {
    return <QueryClientProvider client={queryClient}>{this.props.children}</QueryClientProvider>;
  }
}

export default App;
