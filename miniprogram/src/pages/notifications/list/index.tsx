import { View, Text } from '@tarojs/components';
import './index.scss';

export default function NotificationsListPage() {
  return (
    <View className="notifications-list-page">
      <View className="empty-state">
        <Text className="empty-text">暂无通知</Text>
      </View>
    </View>
  );
}
