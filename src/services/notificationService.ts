import { MOCK_NOTIFICATIONS } from '../data/mockData';

export interface UserNotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  data?: any;
  createdAt: string;
}

const NOTIFICATIONS_STORAGE_KEY = 'ils_user_notifications_v1';

export const notificationService = {
  async getNotifications(): Promise<UserNotificationItem[]> {
    if (typeof window === 'undefined') return MOCK_NOTIFICATIONS;
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(MOCK_NOTIFICATIONS));
      return MOCK_NOTIFICATIONS;
    } catch {
      return MOCK_NOTIFICATIONS;
    }
  },

  async markAsRead(id: string): Promise<boolean> {
    const list = await this.getNotifications();
    const updated = list.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
    return true;
  },

  async markAllAsRead(): Promise<boolean> {
    const list = await this.getNotifications();
    const updated = list.map((n) => ({ ...n, isRead: true }));
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
    return true;
  },
};
