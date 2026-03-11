import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native'
import { router } from 'expo-router'
import { Colors } from '@/constants'
import { useState } from 'react'

interface FeeItem {
  id: string
  name: string
  description: string
  price: string
  unit: string
}

interface FeeCategory {
  id: string
  title: string
  icon: string
  bgColor: string
  items: FeeItem[]
}

export default function FeeConfigsScreen() {
  const [configs, setConfigs] = useState<FeeCategory[]>([
    {
      id: 'utilities',
      title: '水电单价',
      icon: '💧',
      bgColor: '#EFF6FF',
      items: [
        { id: '1', name: '水费单价', description: '', price: '3.50', unit: '/m³' },
        { id: '2', name: '电费单价', description: '', price: '0.60', unit: '/kWh' },
      ],
    },
    {
      id: 'network',
      title: '网费配置',
      icon: '📶',
      bgColor: '#F3E8FF',
      items: [
        { id: '1', name: '50M 宽带', description: '适合1-2人使用', price: '30', unit: '/月' },
        { id: '2', name: '100M 宽带', description: '适合3-4人使用', price: '50', unit: '/月' },
        { id: '3', name: '200M 宽带', description: '适合5人以上', price: '80', unit: '/月' },
      ],
    },
    {
      id: 'management',
      title: '管理费配置',
      icon: '📋',
      bgColor: '#ECFDF5',
      items: [
        { id: '1', name: '日常管理费', description: '公共区域维护、垃圾清运', price: '50', unit: '/月' },
        { id: '2', name: '维修基金', description: '用于房间维修', price: '20', unit: '/月' },
      ],
    },
    {
      id: 'other',
      title: '其他费用',
      icon: '⋯',
      bgColor: '#FFF7ED',
      items: [
        { id: '1', name: '车位费', description: '地上/地下停车位', price: '200', unit: '/月' },
      ],
    },
  ])

  const updatePrice = (categoryId: string, itemId: string, price: string) => {
    setConfigs(prev => prev.map(category => {
      if (category.id === categoryId) {
        return {
          ...category,
          items: category.items.map(item =>
            item.id === itemId ? { ...item, price } : item
          ),
        }
      }
      return category
    }))
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* 顶部导航 */}
      <View
        style={{
          backgroundColor: Colors.primary,
          paddingTop: 24,
          paddingBottom: 24,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 40,
          borderBottomRightRadius: 40,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 20, color: 'white' }}>←</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '900', color: 'white' }}>
            费用配置
          </Text>
          <TouchableOpacity>
            <Text style={{ fontSize: 14, fontWeight: '700', color: 'white' }}>保存</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
          {configs.map((category) => (
            <View
              key={category.id}
              style={{
                backgroundColor: 'white',
                borderRadius: 24,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: '#F3F4F6',
                overflow: 'hidden',
              }}
            >
              {/* 分类标题 */}
              <View
                style={{
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: '#F9FAFB',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      backgroundColor: category.bgColor,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 18 }}>{category.icon}</Text>
                  </View>
                  <Text style={{ marginLeft: 12, fontSize: 14, fontWeight: '700', color: Colors.textPrimary }}>
                    {category.title}
                  </Text>
                </View>
                <Text style={{ color: '#D1D5DB', fontSize: 16 }}>∨</Text>
              </View>

              {/* 费用项列表 */}
              <View style={{ padding: 16 }}>
                {category.items.map((item) => (
                  <View
                    key={item.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#F9FAFB',
                      borderRadius: 16,
                      padding: 12,
                      marginBottom: 12,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary }}>
                        {item.name}
                      </Text>
                      {item.description ? (
                        <Text style={{ fontSize: 10, color: Colors.textMuted, marginTop: 2 }}>
                          {item.description}
                        </Text>
                      ) : null}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, color: Colors.textMuted }}>¥</Text>
                      <TextInput
                        style={{
                          width: 64,
                          textAlign: 'right',
                          backgroundColor: 'white',
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          fontSize: 14,
                          fontWeight: '700',
                          color: Colors.textPrimary,
                          marginHorizontal: 4,
                        }}
                        value={item.price}
                        onChangeText={(text) => updatePrice(category.id, item.id, text)}
                        keyboardType="numeric"
                      />
                      <Text style={{ fontSize: 14, color: Colors.textMuted }}>{item.unit}</Text>
                    </View>
                  </View>
                ))}

                {/* 添加按钮 */}
                <TouchableOpacity
                  style={{
                    paddingVertical: 12,
                    borderWidth: 1,
                    borderStyle: 'dashed',
                    borderColor: '#E5E7EB',
                    borderRadius: 12,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#9CA3AF', marginRight: 4 }}>+</Text>
                  <Text style={{ fontSize: 14, color: '#9CA3AF', fontWeight: '500' }}>
                    添加{category.title.replace('配置', '').replace('单价', '')}项目
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}
