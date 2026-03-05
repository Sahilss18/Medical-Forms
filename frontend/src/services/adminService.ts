import apiClient from './api';
import {
  Inspector,
  LicensingOffice,
  SystemLog,
  ApiResponse,
  PaginatedResponse,
  DynamicForm,
} from '@/types';

export const adminService = {
  // User Management
  async getUsers(role?: string): Promise<ApiResponse<any[]>> {
    return apiClient.get('/admin/users', { role });
  },

  async createUser(data: {
    name: string;
    email: string;
    phone: string;
    role: string;
    district?: string;
    password?: string;
    officeId?: string;
    employeeCode?: string;
    approvalLevel?: string;
  }): Promise<ApiResponse<any>> {
    return apiClient.post('/admin/users', data);
  },

  async setUserActiveStatus(id: string, isActive: boolean): Promise<ApiResponse<any>> {
    return apiClient.patch(`/admin/users/${id}/active`, { isActive });
  },

  async resetUserPassword(id: string, newPassword: string): Promise<ApiResponse<any>> {
    return apiClient.patch(`/admin/users/${id}/reset-password`, { newPassword });
  },

  async assignUserRole(id: string, role: string): Promise<ApiResponse<any>> {
    return apiClient.patch(`/admin/users/${id}/role`, { role });
  },

  // Jurisdiction Management
  async getInspectorJurisdictions(): Promise<ApiResponse<any[]>> {
    return apiClient.get('/admin/jurisdictions/inspectors');
  },

  async updateInspectorJurisdictions(
    inspectorId: string,
    jurisdictions: Array<{ state: string; district: string; taluk?: string }>,
  ): Promise<ApiResponse<any>> {
    return apiClient.put(`/admin/inspectors/${inspectorId}/jurisdictions`, { jurisdictions });
  },

  // Inspector Management
  async getInspectors(): Promise<ApiResponse<Inspector[]>> {
    return apiClient.get('/admin/inspectors');
  },

  async createInspector(data: Partial<Inspector>): Promise<ApiResponse<Inspector>> {
    return apiClient.post('/admin/inspectors', data);
  },

  async updateInspector(id: string, data: Partial<Inspector>): Promise<ApiResponse<Inspector>> {
    return apiClient.put(`/admin/inspectors/${id}`, data);
  },

  async deleteInspector(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/admin/inspectors/${id}`);
  },

  async toggleInspectorStatus(id: string): Promise<ApiResponse<Inspector>> {
    return apiClient.patch(`/admin/inspectors/${id}/toggle-status`);
  },

  // Licensing Office Management
  async getLicensingOffices(): Promise<ApiResponse<LicensingOffice[]>> {
    return apiClient.get('/admin/licensing-offices');
  },

  async createLicensingOffice(data: Partial<LicensingOffice>): Promise<ApiResponse<LicensingOffice>> {
    return apiClient.post('/admin/licensing-offices', data);
  },

  async updateLicensingOffice(id: string, data: Partial<LicensingOffice>): Promise<ApiResponse<LicensingOffice>> {
    return apiClient.put(`/admin/licensing-offices/${id}`, data);
  },

  async deleteLicensingOffice(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/admin/licensing-offices/${id}`);
  },

  // Form Management
  async getForms(): Promise<ApiResponse<DynamicForm[]>> {
    return apiClient.get('/admin/forms');
  },

  async getFormById(id: string): Promise<ApiResponse<DynamicForm>> {
    return apiClient.get(`/admin/forms/${id}`);
  },

  async createForm(data: Partial<DynamicForm>): Promise<ApiResponse<DynamicForm>> {
    return apiClient.post('/admin/forms', data);
  },

  async addFormField(formId: string, data: any): Promise<ApiResponse<any>> {
    return apiClient.post(`/admin/forms/${formId}/fields`, data);
  },

  async updateFormField(fieldId: string, data: any): Promise<ApiResponse<any>> {
    return apiClient.patch(`/admin/forms/fields/${fieldId}`, data);
  },

  async toggleFormActive(id: string): Promise<ApiResponse<any>> {
    return apiClient.patch(`/admin/forms/${id}/toggle-active`);
  },

  async updateForm(id: string, data: Partial<DynamicForm>): Promise<ApiResponse<DynamicForm>> {
    return apiClient.put(`/admin/forms/${id}`, data);
  },

  async deleteForm(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/admin/forms/${id}`);
  },

  // System Logs
  async getSystemLogs(page?: number, limit?: number): Promise<PaginatedResponse<SystemLog>> {
    const response = await apiClient.get<PaginatedResponse<SystemLog>>('/admin/logs', {
      page,
      limit,
    });
    return response.data;
  },

  // Dashboard Stats
  async getDashboardStats(): Promise<ApiResponse<any>> {
    return apiClient.get('/admin/dashboard/stats');
  },

  // Applications & Compliance
  async getApplicationsForAdmin(): Promise<ApiResponse<any[]>> {
    return apiClient.get('/admin/applications');
  },

  async approveAndIssueCertificate(applicationId: string): Promise<ApiResponse<any>> {
    return apiClient.post(`/admin/applications/${applicationId}/approve-issue-certificate`);
  },

  async getComplianceOverview(): Promise<ApiResponse<any>> {
    return apiClient.get('/admin/compliance/overview');
  },
};
