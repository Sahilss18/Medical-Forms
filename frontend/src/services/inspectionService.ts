import apiClient from './api';
import {
  Inspection,
  InspectionReport,
  ApiResponse,
  ChecklistItem,
} from '@/types';

export const inspectionService = {
  async getMyAvailability(): Promise<
    ApiResponse<{
      available: boolean;
      inspectorId: string;
      employeeCode: string;
    }>
  > {
    return apiClient.get('/inspectors/me/availability');
  },

  async updateMyAvailability(
    available: boolean
  ): Promise<
    ApiResponse<{
      available: boolean;
      inspectorId: string;
      employeeCode: string;
    }>
  > {
    return apiClient.patch('/inspectors/me/availability', { available });
  },

  async getAssignedInspections(): Promise<ApiResponse<Inspection[]>> {
    return apiClient.get('/inspections/assigned');
  },

  async getInspectionById(id: string): Promise<ApiResponse<Inspection>> {
    return apiClient.get(`/inspections/${id}`);
  },

  async startInspection(id: string): Promise<ApiResponse<Inspection>> {
    return apiClient.post(`/inspections/${id}/start`);
  },

  async submitReport(
    inspectionId: string,
    data: {
      inspectionDate?: string;
      checklistItems: ChecklistItem[];
      observations: string;
      recommendation: 'approve' | 'reject' | 'clarification';
      photos?: File[];
    }
  ): Promise<ApiResponse<InspectionReport>> {
    if (data.photos && data.photos.length > 0) {
      const formData = new FormData();
      if (data.inspectionDate) {
        formData.append('inspectionDate', data.inspectionDate);
      }
      formData.append('checklistItems', JSON.stringify(data.checklistItems));
      formData.append('observations', data.observations);
      formData.append('recommendation', data.recommendation);
      data.photos.forEach((photo) => formData.append('photos', photo));
      return apiClient.post(`/inspections/${inspectionId}/report`, formData);
    }

    return apiClient.post(`/inspections/${inspectionId}/report`, {
      inspectionDate: data.inspectionDate,
      checklistItems: data.checklistItems,
      observations: data.observations,
      recommendation: data.recommendation,
    });
  },

  async getReport(inspectionId: string): Promise<ApiResponse<InspectionReport>> {
    return apiClient.get(`/inspections/${inspectionId}/report`);
  },

  async updateReport(inspectionId: string, data: Partial<InspectionReport>): Promise<ApiResponse<InspectionReport>> {
    return apiClient.put(`/inspections/${inspectionId}/report`, data);
  },
};
