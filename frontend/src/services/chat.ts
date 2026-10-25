import { API_BASE_URL } from "@/lib/config";

export interface ChatProjectItem {
  id: number;
  title: string;
  stage: string;
  city_name?: string | null;
  last_message_text?: string | null;
  last_message_time?: string | null;
  last_message_sender_id?: number | null;
  last_message_sender_name?: string | null;
  last_message_sender_role?: string | null;
  unread_count: number;
  is_pinned: boolean;
  pinned_at?: string | null;
}

export interface ChatMessage {
  id: number;
  project_id: number;
  sender_id: number;
  sender_name: string;
  sender_role: string;
  body: string;
  created_at: string;
}

export interface UnreadCountResponse {
  unread_count: number;
}

export interface PinResponse {
  message: string;
  is_pinned: boolean;
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

export async function getChatProjects(
  q?: string,
  signal?: AbortSignal,
): Promise<ChatProjectItem[]> {
  const query = q ? `?q=${encodeURIComponent(q)}` : "";
  return request<ChatProjectItem[]>(`/api/chat/projects${query}`, { signal });
}

export async function getChatMessages(
  projectId: number,
  afterId?: number,
  limit: number = 50,
  signal?: AbortSignal,
): Promise<ChatMessage[]> {
  const params = new URLSearchParams();
  if (afterId != null) params.set("after_id", String(afterId));
  if (limit != null) params.set("limit", String(limit));
  const qs = params.toString() ? `?${params.toString()}` : "";
  return request<ChatMessage[]>(`/api/chat/projects/${projectId}/messages${qs}`, { signal });
}

export async function sendChatMessage(
  projectId: number,
  body: string,
): Promise<ChatMessage> {
  return request<ChatMessage>(`/api/chat/projects/${projectId}/messages`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export async function pinChatProject(projectId: number): Promise<PinResponse> {
  return request<PinResponse>(`/api/chat/projects/${projectId}/pin`, {
    method: "PUT",
  });
}

export async function unpinChatProject(projectId: number): Promise<PinResponse> {
  return request<PinResponse>(`/api/chat/projects/${projectId}/pin`, {
    method: "DELETE",
  });
}

export async function getChatUnreadCount(
  signal?: AbortSignal,
): Promise<UnreadCountResponse> {
  return request<UnreadCountResponse>("/api/chat/unread-count", { signal });
}
