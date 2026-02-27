# Apartment Ultra API 接口文档

## 概述

- **基础URL**: `http://localhost:8000/api/v1`
- **认证方式**: Bearer Token (JWT)
- **数据格式**: JSON
- **编码**: UTF-8

## 目录

1. [认证接口](#1-认证接口)
2. [组织管理](#2-组织管理)
3. [公寓管理](#3-公寓管理)
4. [房间管理](#4-房间管理)
5. [租客管理](#5-租客管理)
6. [租约管理](#6-租约管理)
7. [水电读数](#7-水电读数)
8. [账单管理](#8-账单管理)
9. [报表统计](#9-报表统计)

---

## 认证说明

除了登录和注册接口外，其他所有接口都需要在请求头中携带访问令牌：

```
Authorization: Bearer <access_token>
```

---

## 1. 认证接口

### 1.1 用户注册

**POST** `/auth/register`

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "张三"
}
```

**密码要求**:
- 长度至少8个字符
- 必须包含至少一个字母
- 必须包含至少一个数字

**响应** `201`:
```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "张三",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### 1.2 用户登录

**POST** `/auth/login`

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应** `200`:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

---

### 1.3 刷新令牌

**POST** `/auth/refresh`

**请求体**:
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**响应** `200`:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

---

### 1.4 获取当前用户信息

**GET** `/auth/me`

**响应** `200`:
```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "张三",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

## 2. 组织管理

### 2.1 获取组织列表

**GET** `/organizations`

获取当前用户所属的所有组织。

**响应** `200`:
```json
[
  {
    "id": 1,
    "name": "我的公寓",
    "plan": "free",
    "settings": {},
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

---

### 2.2 创建组织

**POST** `/organizations`

**请求体**:
```json
{
  "name": "我的公寓",
  "slug": "my-apartment"
}
```

**注意**: `slug` 为可选参数，不传则自动生成。

**响应** `201`:
```json
{
  "id": 1,
  "name": "我的公寓",
  "plan": "free",
  "settings": {},
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### 2.3 获取组织详情

**GET** `/organizations/{org_id}`

**响应** `200`:
```json
{
  "id": 1,
  "name": "我的公寓",
  "plan": "free",
  "settings": {},
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### 2.4 更新组织

**PUT** `/organizations/{org_id}`

**请求体**:
```json
{
  "name": "新名称",
  "settings": {}
}
```

**响应** `200`:
```json
{
  "id": 1,
  "name": "新名称",
  "plan": "free",
  "settings": {},
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### 2.5 删除组织

**DELETE** `/organizations/{org_id}`

**响应** `200`:
```json
{
  "message": "Organization deleted successfully"
}
```

**注意**: 只有组织所有者才能删除组织。

---

### 2.6 获取组织成员列表

**GET** `/organizations/{org_id}/members`

**响应** `200`:
```json
[
  {
    "id": 1,
    "organization_id": 1,
    "user_id": 1,
    "role": "owner",
    "user_email": "user@example.com",
    "user_full_name": "张三",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

**角色说明**:
- `owner`: 所有者 - 完全权限 + 计费管理
- `admin`: 管理员 - 完全权限
- `member`: 成员 - 读写权限
- `viewer`: 查看者 - 只读权限

---

### 2.7 添加组织成员

**POST** `/organizations/{org_id}/members`

**查询参数**:
- `email` (必填): 用户邮箱
- `role` (可选): 成员角色，默认为 `member`

**响应** `200`:
```json
{
  "id": 2,
  "organization_id": 1,
  "user_id": 2,
  "role": "member",
  "user_email": "newuser@example.com",
  "user_full_name": "李四",
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### 2.8 更新成员角色

**PUT** `/organizations/{org_id}/members/{user_id}`

**查询参数**:
- `role` (必填): 新角色

**响应** `200`:
```json
{
  "id": 2,
  "organization_id": 1,
  "user_id": 2,
  "role": "admin",
  "user_email": "newuser@example.com",
  "user_full_name": "李四",
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### 2.9 移除成员

**DELETE** `/organizations/{org_id}/members/{user_id}`

**响应** `200`:
```json
{
  "message": "Member removed successfully"
}
```

---

## 3. 公寓管理

> 以下接口都需要 `org_id` 查询参数

### 3.1 获取公寓列表

**GET** `/apartments?org_id=1`

**响应** `200`:
```json
[
  {
    "id": 1,
    "organization_id": 1,
    "name": "阳光花园",
    "address": "北京市朝阳区xxx",
    "description": "高档公寓",
    "created_at": "2024-01-01T00:00:00Z",
    "room_stats": {
      "total": 50,
      "available": 10,
      "occupied": 35,
      "maintenance": 5
    }
  }
]
```

---

### 3.2 创建公寓

**POST** `/apartments?org_id=1`

**请求体**:
```json
{
  "name": "阳光花园",
  "address": "北京市朝阳区xxx",
  "description": "高档公寓"
}
```

**响应** `201`:
```json
{
  "id": 1,
  "organization_id": 1,
  "name": "阳光花园",
  "address": "北京市朝阳区xxx",
  "description": "高档公寓",
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### 3.3 获取公寓详情

**GET** `/apartments/{apartment_id}?org_id=1`

**响应** `200`:
```json
{
  "id": 1,
  "organization_id": 1,
  "name": "阳光花园",
  "address": "北京市朝阳区xxx",
  "description": "高档公寓",
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### 3.4 更新公寓

**PUT** `/apartments/{apartment_id}?org_id=1`

**请求体**:
```json
{
  "name": "新名称",
  "address": "新地址",
  "description": "新描述"
}
```

---

### 3.5 删除公寓

**DELETE** `/apartments/{apartment_id}?org_id=1`

**响应** `200`:
```json
{
  "message": "Apartment deleted successfully"
}
```

---

## 4. 房间管理

> 房间接口嵌套在公寓下，需要 `org_id` 查询参数

### 4.1 获取房间列表

**GET** `/apartments/{apartment_id}/rooms?org_id=1`

**响应** `200`:
```json
[
  {
    "id": 1,
    "apartment_id": 1,
    "room_number": "101",
    "layout": "两室一厅",
    "status": "available",
    "monthly_rent": 3000.00,
    "area": 50.00,
    "notes": "朝南",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

**状态说明**:
- `available`: 空置
- `occupied`: 已出租
- `maintenance`: 维护中

---

### 4.2 创建房间

**POST** `/apartments/{apartment_id}/rooms?org_id=1`

**请求体**:
```json
{
  "room_number": "101",
  "layout": "两室一厅",
  "monthly_rent": 3000.00,
  "area": 50.00,
  "notes": "朝南",
  "status": "available"
}
```

---

### 4.3 批量创建房间

**POST** `/apartments/{apartment_id}/rooms/batch?org_id=1`

**请求体**:
```json
{
  "room_numbers": ["101", "102", "103"],
  "layout": "两室一厅",
  "monthly_rent": 3000.00,
  "area": 50.00,
  "notes": "朝南"
}
```

**响应** `201`:
```json
[
  {
    "id": 1,
    "apartment_id": 1,
    "room_number": "101",
    "layout": "两室一厅",
    "status": "available",
    "monthly_rent": 3000.00,
    "area": 50.00,
    "notes": "朝南",
    "created_at": "2024-01-01T00:00:00Z"
  },
  ...
]
```

---

### 4.4 获取房间详情

**GET** `/apartments/rooms/{room_id}?org_id=1`

**响应** `200`:
```json
{
  "id": 1,
  "apartment_id": 1,
  "room_number": "101",
  "layout": "两室一厅",
  "status": "available",
  "monthly_rent": 3000.00,
  "area": 50.00,
  "notes": "朝南",
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### 4.5 更新房间

**PUT** `/apartments/rooms/{room_id}?org_id=1`

**请求体**:
```json
{
  "room_number": "101",
  "layout": "三室一厅",
  "status": "maintenance",
  "monthly_rent": 3500.00,
  "area": 60.00,
  "notes": "装修中"
}
```

---

### 4.6 删除房间

**DELETE** `/apartments/rooms/{room_id}?org_id=1`

**响应** `200`:
```json
{
  "message": "Room deleted successfully"
}
```

---

## 5. 租客管理

### 5.1 获取租客列表

**GET** `/tenants?org_id=1`

**响应** `200`:
```json
[
  {
    "id": 1,
    "organization_id": 1,
    "name": "张三",
    "phone": "13800138000",
    "id_card": "110101199001011234",
    "email": "zhangsan@example.com",
    "emergency_contact": "李四",
    "emergency_phone": "13900139000",
    "notes": "",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

---

### 5.2 创建租客

**POST** `/tenants?org_id=1`

**请求体**:
```json
{
  "name": "张三",
  "phone": "13800138000",
  "id_card": "110101199001011234",
  "email": "zhangsan@example.com",
  "emergency_contact": "李四",
  "emergency_phone": "13900139000",
  "notes": ""
}
```

---

### 5.3 获取租客详情

**GET** `/tenants/{tenant_id}?org_id=1`

---

### 5.4 更新租客

**PUT** `/tenants/{tenant_id}?org_id=1`

---

### 5.5 删除租客

**DELETE** `/tenants/{tenant_id}?org_id=1`

**响应** `200`:
```json
{
  "message": "Tenant deleted successfully"
}
```

---

## 6. 租约管理

### 6.1 获取租约列表

**GET** `/leases?org_id=1&active_only=true`

**查询参数**:
- `org_id` (必填): 组织ID
- `active_only` (可选): 是否只返回活跃租约，默认 `false`

**响应** `200`:
```json
[
  {
    "id": 1,
    "room_id": 1,
    "tenant_id": 1,
    "start_date": "2024-01-01",
    "end_date": "2024-12-31",
    "billing_day": 1,
    "monthly_rent": 3000.00,
    "deposit": 6000.00,
    "water_rate": 5.00,
    "electricity_rate": 0.60,
    "is_active": true,
    "notes": "",
    "created_at": "2024-01-01T00:00:00Z",
    "room": {
      "id": 1,
      "apartment_id": 1,
      "room_number": "101",
      "layout": "两室一厅",
      "status": "occupied",
      "monthly_rent": 3000.00,
      "area": 50.00,
      "notes": "朝南",
      "created_at": "2024-01-01T00:00:00Z",
      "apartment": {
        "id": 1,
        "organization_id": 1,
        "name": "阳光花园",
        "address": "北京市朝阳区xxx",
        "description": "高档公寓",
        "created_at": "2024-01-01T00:00:00Z"
      }
    },
    "tenant": {
      "id": 1,
      "organization_id": 1,
      "name": "张三",
      "phone": "13800138000",
      "id_card": "110101199001011234",
      "email": "zhangsan@example.com",
      "emergency_contact": "李四",
      "emergency_phone": "13900139000",
      "notes": "",
      "created_at": "2024-01-01T00:00:00Z"
    }
  }
]
```

---

### 6.2 创建租约

**POST** `/leases?org_id=1`

**请求体**:
```json
{
  "room_id": 1,
  "tenant_id": 1,
  "start_date": "2024-01-01",
  "end_date": "2024-12-31",
  "billing_day": 1,
  "monthly_rent": 3000.00,
  "deposit": 6000.00,
  "water_rate": 5.00,
  "electricity_rate": 0.60,
  "notes": ""
}
```

**字段说明**:
- `billing_day`: 账单日 (1-28)，默认为1号
- `end_date`: 可选，不填则为不定期租约

**注意**: 创建租约时会自动将房间状态更新为"已出租"，并检查房间在指定时间段是否可用。

---

### 6.3 获取租约详情

**GET** `/leases/{lease_id}?org_id=1`

---

### 6.4 更新租约

**PUT** `/leases/{lease_id}?org_id=1`

**请求体**:
```json
{
  "end_date": "2025-12-31",
  "billing_day": 5,
  "monthly_rent": 3200.00,
  "deposit": 6400.00,
  "water_rate": 5.50,
  "electricity_rate": 0.65,
  "is_active": true,
  "notes": "续租"
}
```

---

### 6.5 终止租约

**POST** `/leases/{lease_id}/terminate?org_id=1`

**响应** `200`:
```json
{
  "message": "Lease terminated successfully",
  "lease": { ... }
}
```

**注意**: 终止租约会自动将房间状态更新为"空置"。

---

### 6.6 删除租约

**DELETE** `/leases/{lease_id}?org_id=1`

**响应** `200`:
```json
{
  "message": "Lease deleted successfully"
}
```

**注意**: 只有已终止的租约才能删除，且只有所有者和管理员有权限。

---

## 7. 水电读数

### 7.1 获取读数列表

**GET** `/utilities?org_id=1&room_id=1&period_year=2024&period_month=1`

**查询参数**:
- `org_id` (必填): 组织ID
- `room_id` (可选): 按房间筛选
- `period_year` (可选): 按年份筛选
- `period_month` (可选): 按月份筛选

**响应** `200`:
```json
[
  {
    "id": 1,
    "room_id": 1,
    "period_year": 2024,
    "period_month": 1,
    "reading_date": "2024-02-01",
    "water_reading": 100.00,
    "electricity_reading": 500.00,
    "water_previous": 90.00,
    "electricity_previous": 450.00,
    "notes": "",
    "created_at": "2024-02-01T00:00:00Z",
    "room": {
      "id": 1,
      "apartment_id": 1,
      "room_number": "101",
      "layout": "两室一厅",
      "status": "occupied",
      "monthly_rent": 3000.00,
      "area": 50.00,
      "notes": "朝南",
      "created_at": "2024-01-01T00:00:00Z",
      "apartment": { ... }
    }
  }
]
```

---

### 7.2 创建读数

**POST** `/utilities?org_id=1`

**请求体**:
```json
{
  "room_id": 1,
  "period_year": 2024,
  "period_month": 1,
  "reading_date": "2024-02-01",
  "water_reading": 100.00,
  "electricity_reading": 500.00,
  "water_previous": 90.00,
  "electricity_previous": 450.00,
  "notes": ""
}
```

---

### 7.3 批量创建读数

**POST** `/utilities/batch?org_id=1`

**请求体**:
```json
{
  "period_year": 2024,
  "period_month": 1,
  "reading_date": "2024-02-01",
  "readings": [
    {
      "room_id": 1,
      "water_reading": 100.00,
      "electricity_reading": 500.00,
      "water_previous": 90.00,
      "electricity_previous": 450.00
    },
    {
      "room_id": 2,
      "water_reading": 200.00,
      "electricity_reading": 600.00,
      "water_previous": 180.00,
      "electricity_previous": 550.00
    }
  ]
}
```

**响应** `200`:
```json
[
  {
    "id": 1,
    "room_id": 1,
    ...
  },
  {
    "id": 2,
    "room_id": 2,
    ...
  }
]
```

---

### 7.4 导出待录入水电的房间

**GET** `/utilities/export?org_id=1&period_year=2024&period_month=1&days_range=5`

**查询参数**:
- `org_id` (必填): 组织ID
- `period_year` (必填): 账单年份
- `period_month` (必填): 账单月份
- `days_range` (可选): 时间范围（天数），不填则返回全部待录入房间

**响应** `200`:
```json
[
  {
    "room_id": 1,
    "apartment_name": "阳光花园",
    "room_number": "101",
    "tenant_name": "张三",
    "billing_day": 1,
    "water_previous": 90.00,
    "electricity_previous": 450.00
  }
]
```

---

### 7.5 获取读数详情

**GET** `/utilities/{reading_id}?org_id=1`

---

### 7.6 更新读数

**PUT** `/utilities/{reading_id}?org_id=1`

**请求体**:
```json
{
  "reading_date": "2024-02-02",
  "water_reading": 105.00,
  "electricity_reading": 510.00,
  "water_previous": 90.00,
  "electricity_previous": 450.00,
  "notes": "重新录入"
}
```

---

### 7.7 删除读数

**DELETE** `/utilities/{reading_id}?org_id=1`

**响应** `200`:
```json
{
  "message": "Utility reading deleted successfully"
}
```

---

## 8. 账单管理

### 8.1 获取账单列表

**GET** `/bills?org_id=1&lease_id=1&year=2024&month=1&status=pending`

**查询参数**:
- `org_id` (必填): 组织ID
- `lease_id` (可选): 按租约筛选
- `year` (可选): 按年份筛选
- `month` (可选): 按月份筛选
- `status` (可选): 按状态筛选 (pending/partial/paid/overdue)

**响应** `200`:
```json
[
  {
    "id": 1,
    "lease_id": 1,
    "bill_year": 2024,
    "bill_month": 1,
    "due_date": "2024-02-05",
    "rent_amount": 3000.00,
    "water_amount": 50.00,
    "electricity_amount": 30.00,
    "other_amount": 0.00,
    "total_amount": 3080.00,
    "paid_amount": 0.00,
    "status": "pending",
    "notes": "",
    "created_at": "2024-02-01T00:00:00Z"
  }
]
```

**状态说明**:
- `pending`: 待付款
- `partial`: 部分付款
- `paid`: 已付清
- `overdue`: 已逾期

---

### 8.2 批量生成账单

**POST** `/bills/generate?org_id=1`

根据活跃租约和水电读数自动生成账单。

**请求体**:
```json
{
  "bill_year": 2024,
  "bill_month": 1,
  "due_date": "2024-02-05",
  "lease_ids": [1, 2, 3]
}
```

**注意**: `lease_ids` 为可选参数，不传则对所有活跃租约生成账单。

**响应** `200`:
```json
{
  "created": 3,
  "skipped": 1
}
```

---

### 8.3 手动创建账单

**POST** `/bills?org_id=1`

**请求体**:
```json
{
  "lease_id": 1,
  "bill_year": 2024,
  "bill_month": 1,
  "due_date": "2024-02-05",
  "rent_amount": 3000.00,
  "water_amount": 50.00,
  "electricity_amount": 30.00,
  "other_amount": 0.00,
  "notes": ""
}
```

---

### 8.4 获取账单详情

**GET** `/bills/{bill_id}?org_id=1`

---

### 8.5 更新账单

**PUT** `/bills/{bill_id}?org_id=1`

**请求体**:
```json
{
  "due_date": "2024-02-10",
  "rent_amount": 3000.00,
  "water_amount": 55.00,
  "electricity_amount": 35.00,
  "other_amount": 0.00,
  "notes": "调整后"
}
```

---

### 8.6 删除账单

**DELETE** `/bills/{bill_id}?org_id=1`

**响应** `200`:
```json
{
  "message": "Bill deleted successfully"
}
```

**注意**: 已有付款记录的账单无法删除。

---

### 8.7 创建付款记录

**POST** `/bills/{bill_id}/payments?org_id=1`

**请求体**:
```json
{
  "amount": 1000.00,
  "payment_date": "2024-02-03",
  "payment_method": "wechat",
  "reference": "转账备注",
  "notes": ""
}
```

**付款方式**:
- `cash`: 现金
- `wechat`: 微信
- `alipay`: 支付宝
- `bank_transfer`: 银行转账
- `other`: 其他

**响应** `200`:
```json
{
  "id": 1,
  "bill_id": 1,
  "amount": 1000.00,
  "payment_date": "2024-02-03",
  "payment_method": "wechat",
  "reference": "转账备注",
  "notes": "",
  "created_at": "2024-02-03T00:00:00Z"
}
```

---

### 8.8 获取付款记录列表

**GET** `/bills/{bill_id}/payments?org_id=1`

**响应** `200`:
```json
[
  {
    "id": 1,
    "bill_id": 1,
    "amount": 1000.00,
    "payment_date": "2024-02-03",
    "payment_method": "wechat",
    "reference": "转账备注",
    "notes": "",
    "created_at": "2024-02-03T00:00:00Z"
  }
]
```

---

### 8.9 导出账单PDF

**GET** `/bills/{bill_id}/pdf?org_id=1`

**响应**: PDF文件下载

---

## 9. 报表统计

### 9.1 仪表盘概览

**GET** `/reports/overview?org_id=1`

**响应** `200`:
```json
{
  "total_rooms": 50,
  "occupied_rooms": 35,
  "available_rooms": 10,
  "maintenance_rooms": 5,
  "occupancy_rate": 70.0,
  "total_tenants": 35,
  "active_leases": 35,
  "pending_bills": 5,
  "pending_amount": 15000.00,
  "total_revenue": 105000.00
}
```

---

### 9.2 年度收入报告

**GET** `/reports/income?org_id=1&year=2024&start_month=1&end_month=12`

**查询参数**:
- `org_id` (必填): 组织ID
- `year` (必填): 年份
- `start_month` (可选): 起始月份
- `end_month` (可选): 结束月份

**响应** `200`:
```json
{
  "year": 2024,
  "monthly_data": [
    {
      "month": 1,
      "rent_income": 105000.00,
      "water_income": 1750.00,
      "electricity_income": 1050.00,
      "other_income": 0.00,
      "total_income": 107800.00
    }
  ],
  "total_rent": 1260000.00,
  "total_water": 21000.00,
  "total_electricity": 12600.00,
  "total_other": 0.00,
  "grand_total": 1293600.00
}
```

---

### 9.3 年度入住率报告

**GET** `/reports/occupancy?org_id=1&year=2024`

**响应** `200`:
```json
{
  "year": 2024,
  "monthly_data": [
    {
      "month": 1,
      "total_rooms": 50,
      "occupied_rooms": 35,
      "occupancy_rate": 70.0
    }
  ],
  "average_occupancy": 72.5
}
```

---

## 错误响应

所有接口在出错时返回统一的错误格式：

```json
{
  "detail": "错误信息描述"
}
```

**常见HTTP状态码**:
- `400` - 请求参数错误
- `401` - 未授权（未登录或令牌过期）
- `403` - 权限不足
- `404` - 资源不存在
- `422` - 数据验证失败
- `500` - 服务器内部错误

---

## 交互式API文档

启动服务后访问以下地址查看交互式API文档：

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## 开发说明

### 请求示例 (curl)

```bash
# 登录获取令牌
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# 使用令牌访问受保护资源
curl http://localhost:8000/api/v1/apartments?org_id=1 \
  -H "Authorization: Bearer <your_access_token>"
```

### 请求示例 (JavaScript)

```javascript
const response = await fetch('http://localhost:8000/api/v1/apartments?org_id=1', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});
const data = await response.json();
```
