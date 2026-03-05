import apiClient from './api';
import { ApiResponse } from '@/types';

export interface InstitutionProfileData {
  id?: string;
  institutionName: string;
  registrationNumber: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  contactPerson: string;
  email: string;
  phone: string;
  institutionType: 'hospital' | 'clinic' | 'pharmacy' | 'research_lab' | 'other';
  establishedYear: string;
  licenseNumber?: string;
}

export const institutionService = {
  async getMyInstitution(): Promise<ApiResponse<InstitutionProfileData>> {
    return apiClient.get('/institutions/me');
  },

  async updateMyInstitution(
    data: InstitutionProfileData,
  ): Promise<ApiResponse<InstitutionProfileData>> {
    return apiClient.put('/institutions/me', data);
  },
};
