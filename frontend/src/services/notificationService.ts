import apiClient from './api';
import { Notification, ApiResponse } from '@/types';

export const notificationService = {
  async getNotifications(): Promise<ApiResponse<Notification[]>> {
    return apiClient.get('/notifications');
  },

  async markAsRead(id: string): Promise<ApiResponse<void>> {
    return apiClient.patch(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<ApiResponse<void>> {
    return apiClient.post('/notifications/mark-all-read');
  },

  async deleteNotification(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/notifications/${id}`);
  },
};
