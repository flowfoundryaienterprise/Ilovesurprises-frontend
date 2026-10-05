import { apiClient } from './apiClient';

export interface UserNotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  data?: any;
  createdAt: string;
}

export const notificationService = {
  async getNotifications(): Promise<UserNotificationItem[]> {
    const token = apiClient.getAuthToken();
    if (!token) return [];
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { notifications: UserNotificationItem[] };
      }>('/api/notifications');
      return response.data?.notifications || [];
    } catch {
      return [];
    }
  },

  async markAsRead(id: string): Promise<boolean> {
    const token = apiClient.getAuthToken();
    if (!token) return false;
    try {
      await apiClient.patch(`/api/notifications/${id}/read`);
      return true;
    } catch {
      return false;
    }
  },

  async markAllAsRead(): Promise<boolean> {
    const token = apiClient.getAuthToken();
    if (!token) return false;
    try {
      await apiClient.patch('/api/notifications/read-all');
      return true;
    } catch {
      return false;
    }
  },
};
