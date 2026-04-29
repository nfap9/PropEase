// Re-export from service layer for backward compatibility
// These functions are defined in services/authMembership.service.ts to avoid
// utils layer depending on services layer
export { requireOrgMembership, requirePermission } from '../services/authMembership.service.js';
