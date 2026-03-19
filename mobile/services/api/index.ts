export { api, request, ApiError, secureStorage, type ApiResponse, type FieldError } from './client'
export { authApi } from './auth'
export { apartmentsApi, type ApartmentWithStats } from './apartments'
export { roomsApi } from './rooms'
export { tenantsApi, type TenantListParams, type TenantWithLease } from './tenants'
export { leasesApi, type LeaseListParams, type LeaseWithDetails } from './leases'
export { billsApi, type BillListParams, type BillWithDetails } from './bills'
export {
  utilitiesApi,
  type UtilityExportRoom,
  type UtilityListParams,
  type UtilityWithDetails,
} from './utilities'
export { reportsApi, type IncomeReportParams, type OccupancyReportParams, type DashboardOverview } from './reports'
export { organizationsApi, type OrganizationMember } from './organizations'
