import { API_BASE_URL } from "@/lib/config";

export type ProjectLinkKind = "gov" | "planner" | "public";

export interface NotificationItem {
  id: number;
  project_id: number;
  kind: string;
  message: string;
  created_at: string;
  is_read: boolean;
  project_link_kind: ProjectLinkKind;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  unread_count: number;
}

export interface NotificationReadResponse {
  id: number;
  is_read: boolean;
  read_at?: string | null;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail ?? `Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function getMyNotifications(
  limit: number = 20,
  offset: number = 0,
  signal?: AbortSignal
): Promise<NotificationListResponse> {
  return request<NotificationListResponse>(
    `/api/me/notifications?limit=${limit}&offset=${offset}`,
    { method: "GET", signal }
  );
}

export async function markNotificationRead(
  notificationId: number
): Promise<NotificationReadResponse> {
  return request<NotificationReadResponse>(
    `/api/me/notifications/${notificationId}/read`,
    { method: "POST" }
  );
}

export async function markAllNotificationsRead(): Promise<{ message: string }> {
  return request<{ message: string }>(
    "/api/me/notifications/read-all",
    { method: "POST" }
  );
}
