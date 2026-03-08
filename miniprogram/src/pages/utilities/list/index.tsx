import { View, Text } from '@tarojs/components';
import './index.scss';

export default function UtilitiesListPage() {
  return (
    <View className="utilities-list-page">
      <View className="empty-state">
        <Text className="empty-text">暂无水电记录</Text>
      </View>
    </View>
  );
}
