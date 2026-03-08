import { View, Text } from '@tarojs/components';
import './index.scss';

export default function BillsListPage() {
  return (
    <View className="bills-list-page">
      <View className="empty-state">
        <Text className="empty-text">暂无账单</Text>
      </View>
    </View>
  );
}
