// 公寓相关类型
export interface Apartment {
  id: number
  name: string
  address: string
  totalRooms: number
  occupiedRooms: number
  vacantRooms: number
  maintenanceRooms: number
}

export interface Room {
  id: number
  number: string
  apartmentId: number
  apartmentName: string
  status: 'vacant' | 'occupied' | 'maintenance'
  floor: number
}

// 租客相关类型
export interface Tenant {
  id: number
  name: string
  phone: string
  idCard?: string
  leaseCount: number
}

// 账单相关类型
export type BillStatus = 'pending' | 'paid' | 'overdue'

export interface Bill {
  id: number
  billNo: string
  tenantName: string
  roomNumber: string
  amount: number
  status: BillStatus
  dueDate: string
}

// 报表相关类型
export interface DashboardOverview {
  totalApartments: number
  totalRooms: number
  occupiedRooms: number
  vacantRooms: number
  maintenanceRooms: number
  totalTenants: number
  monthlyIncome: number
  pendingBills: number
}
