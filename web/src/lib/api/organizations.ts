import api from './client';
import { Organization, OrganizationMember, MemberRole } from '@/types';

export const organizationsApi = {
  list: async (): Promise<Organization[]> => {
    const response = await api.get<Organization[]>('/organizations');
    return response.data;
  },

  get: async (id: string): Promise<Organization> => {
    const response = await api.get<Organization>(`/organizations/${id}`);
    return response.data;
  },

  create: async (data: { name: string; slug: string }): Promise<Organization> => {
    const response = await api.post<Organization>('/organizations', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Organization>): Promise<Organization> => {
    const response = await api.put<Organization>(`/organizations/${id}`, data);
    return response.data;
  },

  getMembers: async (orgId: string): Promise<OrganizationMember[]> => {
    const response = await api.get<OrganizationMember[]>(`/organizations/${orgId}/members`);
    return response.data;
  },

  addMember: async (orgId: string, data: { user_email: string; role: MemberRole }): Promise<OrganizationMember> => {
    const params = new URLSearchParams({ email: data.user_email, role: data.role });
    const response = await api.post<OrganizationMember>(`/organizations/${orgId}/members?${params}`);
    return response.data;
  },

  updateMember: async (orgId: string, memberId: string, data: { role: MemberRole }): Promise<OrganizationMember> => {
    const params = new URLSearchParams({ role: data.role });
    const response = await api.put<OrganizationMember>(`/organizations/${orgId}/members/${memberId}?${params}`);
    return response.data;
  },

  removeMember: async (orgId: string, memberId: string): Promise<void> => {
    await api.delete(`/organizations/${orgId}/members/${memberId}`);
  },
};

export default organizationsApi;
