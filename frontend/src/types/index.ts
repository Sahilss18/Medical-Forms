// User and Authentication Types
// Backend returns uppercase roles (APPLICANT, INSPECTOR, OFFICER, ADMIN)
export type UserRole = 'APPLICANT' | 'INSPECTOR' | 'OFFICER' | 'ADMIN' | 'applicant' | 'inspector' | 'officer' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone: string;
  district?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface OTPVerification {
  email: string;
  otp: string;
}

// Application Types
export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_scrutiny'
  | 'clarification_requested'
  | 'inspection_assigned'
  | 'inspection_completed'
  | 'decision_pending'
  | 'approved'
  | 'rejected';

// Document Types
export interface ApplicationDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

// Timeline Types
export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  status: ApplicationStatus;
  timestamp: string;
  actor: {
    name: string;
    role: UserRole;
  };
  metadata?: Record<string, any>;
}

export interface Application {
  id: string;
  applicantId: string;
  institutionId: string;
  formId: string;
  formData: Record<string, any>;
  status: ApplicationStatus;
  submittedAt?: string;
  updatedAt: string;
  createdAt: string;
  documents: ApplicationDocument[];
  timeline: TimelineEvent[];
  remarks?: string;
  assignedInspectorId?: string;
  assignedOfficerId?: string;
  certificateUrl?: string;
}

export interface ApplicationListItem {
  id: string;
  institutionName: string;
  applicantName: string;
  formType: string;
  status: ApplicationStatus;
  submittedAt?: string;
  updatedAt: string;
  district: string;
}

// Institution Types
export interface Institution {
  id: string;
  name: string;
  registrationNumber: string;
  type: string;
  address: {
    street: string;
    city: string;
    district: string;
    state: string;
    pincode: string;
  };
  contactPerson: {
    name: string;
    designation: string;
    phone: string;
    email: string;
  };
  establishedYear: number;
  licenseNumber?: string;
  createdAt: string;
  updatedAt: string;
}

// Form Types
export type FieldType = 
  | 'text' 
  | 'email' 
  | 'number' 
  | 'tel' 
  | 'textarea' 
  | 'select' 
  | 'radio' 
  | 'checkbox' 
  | 'date' 
  | 'file';

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  order_index?: number;
  placeholder?: string;
  helpText?: string;
  options?: { label: string; value: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
  conditional?: {
    field: string;
    value: any;
  };
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
}

export interface DynamicForm {
  id: string;
  name: string;
  version: string;
  sections: FormSection[];
}

// Inspection Types
export interface Inspection {
  id: string;
  applicationId: string;
  inspectorId: string;
  inspectorName: string;
  institutionName?: string;
  district?: string;
  contactPerson?: string;
  contactPhone?: string;
  scheduledDate: string;
  completedDate?: string;
  status: 'assigned' | 'in_progress' | 'completed';
  report?: InspectionReport;
}

export interface InspectionReport {
  id: string;
  inspectionId: string;
  checklistItems: ChecklistItem[];
  observations: string;
  recommendation: 'approve' | 'reject' | 'clarification';
  photos: ApplicationDocument[];
  submittedAt: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  status: 'compliant' | 'non_compliant' | 'not_applicable';
  remarks?: string;
}

// Certificate Types
export interface Certificate {
  id: string;
  applicationId: string;
  certificateNumber: string;
  issuedDate: string;
  validUntil: string;
  institutionName: string;
  url: string;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  link?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Filter and Query Types
export interface ApplicationFilters {
  status?: ApplicationStatus[];
  district?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

// Admin Types
export interface Inspector {
  id: string;
  name: string;
  email: string;
  phone: string;
  district: string;
  assignedCount: number;
  isActive: boolean;
}

export interface LicensingOffice {
  id: string;
  name: string;
  district: string;
  address: string;
  contactNumber: string;
  email: string;
  officerId: string;
}

export interface SystemLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  timestamp: string;
  ipAddress: string;
  details: Record<string, any>;
}
