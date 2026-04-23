import type { FacilityPreset } from '@/types';

/** 家具预设列表 */
export const FURNITURE_PRESETS: FacilityPreset[] = [
  { code: 'bed', label: '床', category: 'furniture', default_quantity: 1 },
  { code: 'mattress', label: '床垫', category: 'furniture', default_quantity: 1 },
  { code: 'wardrobe', label: '衣柜', category: 'furniture', default_quantity: 1 },
  { code: 'desk', label: '书桌', category: 'furniture', default_quantity: 1 },
  { code: 'chair', label: '椅子', category: 'furniture', default_quantity: 1 },
  { code: 'sofa', label: '沙发', category: 'furniture', default_quantity: 1 },
  { code: 'tea_table', label: '茶几', category: 'furniture', default_quantity: 1 },
  { code: 'dining_table', label: '餐桌', category: 'furniture', default_quantity: 1 },
  { code: 'dining_chair', label: '餐椅', category: 'furniture', default_quantity: 1 },
  { code: 'nightstand', label: '床头柜', category: 'furniture', default_quantity: 1 },
  { code: 'bookshelf', label: '书架', category: 'furniture', default_quantity: 1 },
];

/** 家电预设列表 */
export const APPLIANCE_PRESETS: FacilityPreset[] = [
  { code: 'ac', label: '空调', category: 'appliances', default_quantity: 1 },
  { code: 'fridge', label: '冰箱', category: 'appliances', default_quantity: 1 },
  { code: 'washing_machine', label: '洗衣机', category: 'appliances', default_quantity: 1 },
  { code: 'tv', label: '电视', category: 'appliances', default_quantity: 1 },
  { code: 'water_heater', label: '热水器', category: 'appliances', default_quantity: 1 },
  { code: 'microwave', label: '微波炉', category: 'appliances', default_quantity: 1 },
  { code: 'induction_cooker', label: '电磁炉', category: 'appliances', default_quantity: 1 },
  { code: 'range_hood', label: '抽油烟机', category: 'appliances', default_quantity: 1 },
  { code: 'rice_cooker', label: '电饭煲', category: 'appliances', default_quantity: 1 },
];

/** 获取所有预设（合并） */
export const ALL_FACILITY_PRESETS = [...FURNITURE_PRESETS, ...APPLIANCE_PRESETS];


