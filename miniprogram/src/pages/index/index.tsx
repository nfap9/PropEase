import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import './index.scss';

export default function IndexPage() {
  const { user, organization, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    // 未登录时跳转到登录页
    if (!isLoading && !isAuthenticated) {
      Taro.redirectTo({ url: '/pages/auth/login/index' });
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <View className="loading-container">
        <Text>加载中...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <View className="index-page">
      <View className="header">
        <View className="user-info">
          <View className="avatar">{user?.full_name?.charAt(0) || 'U'}</View>
          <View className="info">
            <Text className="name">{user?.full_name || '用户'}</Text>
            <Text className="org">{organization?.name || '暂无组织'}</Text>
          </View>
        </View>
      </View>

      <View className="content">
        <View className="stats-grid">
          <View className="stat-card">
            <Text className="stat-value">--</Text>
            <Text className="stat-label">入住率</Text>
          </View>
          <View className="stat-card">
            <Text className="stat-value">--</Text>
            <Text className="stat-label">本月收入</Text>
          </View>
          <View className="stat-card">
            <Text className="stat-value">--</Text>
            <Text className="stat-label">待收账单</Text>
          </View>
          <View className="stat-card">
            <Text className="stat-value">--</Text>
            <Text className="stat-label">逾期账单</Text>
          </View>
        </View>

        <View className="section">
          <Text className="section-title">待办提醒</Text>
          <View className="empty-state">
            <Text className="empty-text">暂无待办事项</Text>
          </View>
        </View>

        <View className="section">
          <Text className="section-title">快捷操作</Text>
          <View className="quick-actions">
            <View
              className="action-item"
              onClick={() => Taro.navigateTo({ url: '/pages/utilities/list/index' })}
            >
              <Text className="action-icon">⚡</Text>
              <Text className="action-text">水电录入</Text>
            </View>
            <View
              className="action-item"
              onClick={() => Taro.navigateTo({ url: '/pages/bills/list/index' })}
            >
              <Text className="action-icon">💰</Text>
              <Text className="action-text">账单收款</Text>
            </View>
            <View className="action-item">
              <Text className="action-icon">📊</Text>
              <Text className="action-text">更多</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
