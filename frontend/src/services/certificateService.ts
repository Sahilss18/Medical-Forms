import apiClient from './api';
import { ApiResponse } from '@/types';

export interface MyCertificate {
  id: string;
  applicationId: string;
  certificateNumber: string;
  formType: string;
  institutionName: string;
  issuedDate: string;
  validUntil: string;
  status: 'active' | 'expired' | 'revoked';
  downloadUrl: string;
}

export const certificateService = {
  async getMyCertificates(): Promise<ApiResponse<MyCertificate[]>> {
    return apiClient.get('/certificates/my');
  },

  async getDownloadLink(certificateId: string): Promise<ApiResponse<{ id: string; found: boolean; downloadUrl: string | null }>> {
    return apiClient.get(`/certificates/${certificateId}/download-link`);
  },
};
