import { Tabs } from 'expo-router'
import { View, Text, Platform } from 'react-native'
import { Colors } from '@/constants'

// Tab 图标组件
function TabIcon({ icon, label, active }: { icon: string; label: string; active: boolean }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 8 }}>
      <Text style={{ fontSize: 20, marginBottom: 2 }}>{icon}</Text>
      <Text
        style={{
          fontSize: 10,
          fontWeight: '700',
          color: active ? Colors.primary : '#9CA3AF',
        }}
      >
        {label}
      </Text>
    </View>
  )
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopColor: '#F3F4F6',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          tabBarIcon: ({ focused }) => <TabIcon icon="🏠" label="首页" active={focused} />,
        }}
      />
      <Tabs.Screen
        name="properties"
        options={{
          title: '房源',
          tabBarIcon: ({ focused }) => <TabIcon icon="🏢" label="房源" active={focused} />,
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: '客户',
          tabBarIcon: ({ focused }) => <TabIcon icon="👥" label="客户" active={focused} />,
        }}
      />
      <Tabs.Screen
        name="bills"
        options={{
          title: '账单',
          tabBarIcon: ({ focused }) => <TabIcon icon="📄" label="账单" active={focused} />,
          tabBarBadge: 5,
          tabBarBadgeStyle: {
            backgroundColor: Colors.danger,
            fontSize: 8,
            minWidth: 16,
            height: 16,
            borderRadius: 8,
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          tabBarIcon: ({ focused }) => <TabIcon icon="👤" label="我的" active={focused} />,
        }}
      />
    </Tabs>
  )
}
