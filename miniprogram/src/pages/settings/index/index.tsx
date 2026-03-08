import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAuth } from '@/hooks/useAuth';
import './index.scss';

export default function SettingsPage() {
  const { user, organization, logout } = useAuth();

  const handleLogout = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          logout();
        }
      },
    });
  };

  return (
    <View className="settings-page">
      <View className="user-card">
        <View className="avatar">{user?.full_name?.charAt(0) || 'U'}</View>
        <View className="info">
          <Text className="name">{user?.full_name || '用户'}</Text>
          <Text className="phone">{user?.phone || ''}</Text>
        </View>
      </View>

      <View className="menu-list">
        <View className="menu-item">
          <Text className="menu-label">当前组织</Text>
          <Text className="menu-value">{organization?.name || '暂无'}</Text>
        </View>
        <View className="menu-item">
          <Text className="menu-label">个人资料</Text>
          <Text className="menu-arrow">{'>'}</Text>
        </View>
      </View>

      <View className="logout-btn" onClick={handleLogout}>
        <Text>退出登录</Text>
      </View>
    </View>
  );
}
