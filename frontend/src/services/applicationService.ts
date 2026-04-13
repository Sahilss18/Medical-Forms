import apiClient from './api';
import {
  Application,
  ApplicationListItem,
  ApplicationFilters,
  ApiResponse,
  DynamicForm,
  ApplicationDocument,
  ApplicationStatus,
} from '@/types';

type RawApplication = Record<string, any>;

const statusMap: Record<string, ApplicationStatus> = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  SCRUTINY: 'under_scrutiny',
  CLARIFICATION: 'clarification_requested',
  INSPECTION_ASSIGNED: 'inspection_assigned',
  INSPECTION_COMPLETED: 'inspection_completed',
  DECISION_PENDING: 'decision_pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  under_scrutiny: 'under_scrutiny',
  clarification_requested: 'clarification_requested',
  inspection_assigned: 'inspection_assigned',
  inspection_completed: 'inspection_completed',
  decision_pending: 'decision_pending',
  submitted: 'submitted',
  approved: 'approved',
  rejected: 'rejected',
  draft: 'draft',
};

function normalizeStatus(value: unknown): ApplicationStatus {
  if (typeof value !== 'string') {
    return 'submitted';
  }

  return statusMap[value] || statusMap[value.toUpperCase()] || 'submitted';
}

function normalizeApplication(raw: RawApplication): Application {
  const valuesArray = Array.isArray(raw.values) ? raw.values : [];
  const formDataFromValues = valuesArray.reduce((acc: Record<string, any>, item: any) => {
    const key = item?.field_id || item?.key || item?.name;
    if (key) {
      acc[key] = item?.value ?? null;
    }
    return acc;
  }, {});

  const status = normalizeStatus(raw.status);

  return {
    id: raw.id,
    applicantId: raw.applicantId || raw.applicant_id || raw.institution?.user_id || '',
    institutionId: raw.institutionId || raw.institution_id || raw.institution?.id || '',
    formId: raw.formId || raw.form_id || raw.form?.form_code || raw.form?.id || '',
    formData: raw.formData || raw.form_data || formDataFromValues || {},
    status,
    submittedAt: raw.submittedAt || raw.submitted_at,
    updatedAt: raw.updatedAt || raw.updated_at || raw.createdAt || raw.created_at,
    createdAt: raw.createdAt || raw.created_at || raw.updatedAt || raw.updated_at,
    documents: (raw.documents || []) as ApplicationDocument[],
    timeline: raw.timeline || [],
    remarks: raw.remarks || raw.current_stage,
    assignedInspectorId: raw.assignedInspectorId || raw.assigned_inspector_id,
    assignedOfficerId: raw.assignedOfficerId || raw.assigned_officer_id,
    certificateUrl: raw.certificateUrl || raw.certificate_url,
    inspection: raw.inspection || null,
  };
}

function toListItem(raw: RawApplication): ApplicationListItem {
  const app = normalizeApplication(raw);
  const institutionName = raw.institutionName || raw.institution?.name || 'Unknown Institution';
  const applicantName =
    raw.applicantName ||
    raw.institution?.contact_person ||
    raw.institution?.name ||
    'Applicant';
  const formType = raw.formType || raw.form?.title || raw.form?.form_code || `Form ${app.formId}`;
  const district = raw.district || raw.institution?.district || '';

  return {
    id: app.id,
    institutionName,
    applicantName,
    formType,
    status: app.status,
    submittedAt: app.submittedAt,
    updatedAt: app.updatedAt,
    district,
  };
}

export const applicationService = {
  async getApplications(
    filters?: ApplicationFilters,
  ): Promise<ApiResponse<ApplicationListItem[]>> {
    const response = await apiClient.get<any[]>('/applications', {
      ...filters,
    });

    const data = Array.isArray(response.data)
      ? response.data.map((item: RawApplication) => toListItem(item))
      : [];

    return {
      ...response,
      data,
    };
  },

  async getApplicationById(id: string): Promise<ApiResponse<Application>> {
    const response = await apiClient.get<RawApplication>(`/applications/${id}`);
    return {
      ...response,
      data: normalizeApplication(response.data as RawApplication),
    };
  },

  async createApplication(data: Partial<Application>): Promise<ApiResponse<Application>> {
    return apiClient.post('/applications', data);
  },

  async updateApplication(id: string, data: Partial<Application>): Promise<ApiResponse<Application>> {
    return apiClient.put(`/applications/${id}`, data);
  },

  async submitApplication(id: string): Promise<ApiResponse<Application>> {
    return apiClient.post(`/applications/${id}/submit`);
  },

  async saveDraft(id: string, data: any): Promise<ApiResponse<Application>> {
    return apiClient.patch(`/applications/${id}/draft`, data);
  },

  async requestClarification(id: string, remarks: string): Promise<ApiResponse<Application>> {
    return apiClient.post(`/applications/${id}/clarification`, { remarks });
  },

  async respondToClarification(id: string, response: string, documents?: File[]): Promise<ApiResponse<Application>> {
    if (documents && documents.length > 0) {
      // Handle file uploads
      const formData = new FormData();
      formData.append('response', response);
      documents.forEach((doc) => formData.append('documents', doc));
      return apiClient.post(`/applications/${id}/clarification-response`, formData);
    }
    return apiClient.post(`/applications/${id}/clarification-response`, { response });
  },

  async assignInspector(
    id: string, 
    inspectorId: string, 
    scheduledDate: string,
    specialInstructions?: string,
    documentsToVerify?: Array<{ id: string; name: string; url: string; type: string }>
  ): Promise<ApiResponse<Application>> {
    return apiClient.post(`/applications/${id}/assign-inspector`, {
      inspectorId,
      scheduledDate,
      specialInstructions,
      documentsToVerify,
    });
  },

  async makeDecision(
    id: string,
    decision: 'approved' | 'rejected',
    remarks?: string
  ): Promise<ApiResponse<Application>> {
    return apiClient.post(`/applications/${id}/decision`, { decision, remarks });
  },

  async uploadDocument(applicationId: string, file: File): Promise<ApiResponse<ApplicationDocument>> {
    return apiClient.uploadFile(`/applications/${applicationId}/documents`, file);
  },

  async deleteDocument(applicationId: string, documentId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/applications/${applicationId}/documents/${documentId}`);
  },

  async downloadCertificate(applicationId: string): Promise<Blob> {
    const response = await apiClient.get<Blob>(`/applications/${applicationId}/certificate`);
    return response.data;
  },

  async getForm(formId: string): Promise<ApiResponse<DynamicForm>> {
    const response = await apiClient.get(`/forms/${formId}`);
    
    // Transform backend form structure to match frontend DynamicForm interface
    if (response.success && response.data) {
      const backendForm = response.data as any;
      
      // Transform backend fields to frontend format
      const transformedFields = (backendForm.fields || []).map((field: any) => {
        const validationRules = field.validation_rules || {};
        
        // Extract options from validation_rules for select fields
        const options = validationRules.options 
          ? validationRules.options.map((opt: string) => ({
              label: opt,
              value: opt,
            }))
          : undefined;
        
        return {
          id: field.id,
          name: field.field_name,
          label: field.label,
          type: field.field_type,
          required: field.required,
          order_index: field.order_index,
          options: options,
          validation: validationRules,
          conditional: validationRules.conditional,
        };
      });
      
      const transformedForm: DynamicForm = {
        id: backendForm.id,
        code: backendForm.form_code,
        name: backendForm.title || backendForm.form_code,
        version: '1.0',
        sections: [
          {
            id: 'section-1',
            title: backendForm.title || 'Form Details',
            description: '',
            fields: transformedFields,
          },
        ],
      };
      return { ...response, data: transformedForm } as ApiResponse<DynamicForm>;
    }
    
    return response as ApiResponse<DynamicForm>;
  },

  async getAvailableInspectors(): Promise<
    ApiResponse<Array<{ id: string; name: string; district: string; workload: number }>>
  > {
    return apiClient.get('/applications/inspectors/available');
  },

  async deleteApplication(applicationId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/applications/${applicationId}`);
  },
};
