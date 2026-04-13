import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    submitted: 'bg-blue-100 text-blue-800',
    under_scrutiny: 'bg-yellow-100 text-yellow-800',
    clarification_requested: 'bg-orange-100 text-orange-800',
    inspection_assigned: 'bg-purple-100 text-purple-800',
    inspection_completed: 'bg-indigo-100 text-indigo-800',
    decision_pending: 'bg-amber-100 text-amber-800',
    withdrawn: 'bg-rose-100 text-rose-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return statusColors[status] || 'bg-gray-100 text-gray-800';
}

export function getStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    draft: 'Draft',
    submitted: 'Submitted',
    under_scrutiny: 'Under Scrutiny',
    clarification_requested: 'Clarification Requested',
    inspection_assigned: 'Inspection Assigned',
    inspection_completed: 'Inspection Completed',
    decision_pending: 'Decision Pending',
    withdrawn: 'Withdrawn',
    approved: 'Approved',
    rejected: 'Rejected',
  };
  return statusLabels[status] || status;
}

export function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function validateFile(
  file: File,
  maxSize: number = 5 * 1024 * 1024, // 5MB
  allowedTypes: string[] = ['application/pdf', 'image/jpeg', 'image/png']
): { valid: boolean; error?: string } {
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size must be less than ${formatFileSize(maxSize)}`,
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Allowed types: PDF, JPEG, PNG',
    };
  }

  return { valid: true };
}
