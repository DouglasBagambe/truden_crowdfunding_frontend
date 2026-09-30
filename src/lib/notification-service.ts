import { apiClient } from "@/lib/api-client";

export type NotificationCategory =
  "financial" | "campaign" | "system" | "security";

export interface KeiboNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  link?: string;
  readAt?: string | null;
  createdAt: string;
}

export async function getNotifications(
  category?: NotificationCategory,
): Promise<KeiboNotification[]> {
  const response = await apiClient.get<KeiboNotification[]>("/notifications", {
    params: category ? { category } : undefined,
  });
  return response.data;
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiClient.post(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.post("/notifications/read-all");
}
