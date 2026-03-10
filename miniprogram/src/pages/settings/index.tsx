import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '@/stores'
import './index.scss'

export default function SettingsPage() {
  const { user, logout } = useAuthStore()
  const [userInfo, setUserInfo] = useState<any>(null)

  useEffect(() => {
    const storedUser = Taro.getStorageSync('user')
    if (storedUser) {
      try {
        setUserInfo(JSON.parse(storedUser))
      } catch {
        setUserInfo({ name: '管理员', phone: '13800138000' })
      }
    } else {
      setUserInfo({ name: '管理员', phone: '13800138000' })
    }
  }, [])

  const handleLogout = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          logout()
          Taro.navigateTo({ url: '/pages/login/index' })
        }
      },
    })
  }

  const menuItems = [
    { id: 'org', name: '切换组织', icon: '🏢', arrow: true },
    { id: 'subscription', name: '订阅信息', icon: '💳', arrow: true },
    { id: 'notifications', name: '消息通知', icon: '🔔', arrow: true },
    { id: 'about', name: '关于我们', icon: 'ℹ️', arrow: true },
  ]

  const formatPhone = (phone: string) => {
    if (!phone) return ''
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
  }

  return (
    <ScrollView className="settings-page" scrollY>
      {/* 用户信息 */}
      <View className="user-section">
        <View className="user-avatar">
          <Text>{userInfo?.name?.charAt(0) || '管'}</Text>
        </View>
        <View className="user-info">
          <Text className="user-name">{userInfo?.name || '管理员'}</Text>
          <Text className="user-phone">{formatPhone(userInfo?.phone || '')}</Text>
        </View>
      </View>

      {/* 菜单列表 */}
      <View className="menu-section">
        {menuItems.map((item) => (
          <View key={item.id} className="menu-item">
            <View className="menu-item-left">
              <Text className="menu-icon">{item.icon}</Text>
              <Text className="menu-name">{item.name}</Text>
            </View>
            {item.arrow && <Text className="menu-arrow">›</Text>}
          </View>
        ))}
      </View>

      {/* 退出登录 */}
      <View className="logout-section">
        <View className="logout-btn" onClick={handleLogout}>
          <Text>退出登录</Text>
        </View>
      </View>

      {/* 版本信息 */}
      <View className="version">
        <Text>版本 1.0.0</Text>
      </View>
    </ScrollView>
  )
}
