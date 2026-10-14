import { API_BASE_URL } from "@/lib/config";

export const userRoles = ["Citizen", "Urban Planner", "Government Official", "Administrator"] as const;
export type UserRole = (typeof userRoles)[number];

export type AdminUser = {
  id: number;
  name: string;
  full_name: string;
  email: string;
  role: UserRole;
  city: string | null;
  is_active: boolean;
  is_demo: boolean;
  created_at: string;
  last_login_at: string | null;
};

export type AdminUserList = AdminUser[] & { total: number };

export type AdminStats = {
  users_by_role: Record<string, number>;
  active_vs_inactive: { active: number; inactive: number };
  deployed_projects_by_stage: Record<string, number>;
  comments_last_7_days: number;
  logins_last_7_days: number | null;
  logins_tracking_status: string;
};

export type CreateOfficialPayload = {
  name: string;
  email: string;
  phone?: string;
  password: string;
  city?: string;
  role?: "Official" | "Planner";
};

export type UserListParams = {
  q?: string;
  role?: string;
  status?: string;
  limit?: number;
  offset?: number;
  include_demo?: boolean;
};

export type PaginatedUsersResponse = {
  items: AdminUser[];
  total: number;
  limit: number;
  offset: number;
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail ?? "Unable to complete the admin request.");
  }
  return response.json() as Promise<T>;
}

export async function getUsers(params?: UserListParams): Promise<AdminUserList> {
  const searchParams = new URLSearchParams();
  if (params?.q) searchParams.set("q", params.q);
  if (params?.role) searchParams.set("role", params.role);
  if (params?.status) searchParams.set("status", params.status);
  if (params?.limit !== undefined) searchParams.set("limit", String(params.limit));
  if (params?.offset !== undefined) searchParams.set("offset", String(params.offset));
  if (params?.include_demo) searchParams.set("include_demo", "true");

  const queryStr = searchParams.toString();
  const path = queryStr ? `/api/admin/users?${queryStr}` : "/api/admin/users";

  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail ?? "Unable to load users.");
  }

  const totalHeader = response.headers.get("X-Total-Count");
  const data = await response.json();

  let list: AdminUser[] = [];
  let total = 0;
  if (Array.isArray(data)) {
    list = data as AdminUser[];
    total = totalHeader ? parseInt(totalHeader, 10) : list.length;
  } else if (data && Array.isArray((data as PaginatedUsersResponse).items)) {
    const paginated = data as PaginatedUsersResponse;
    list = paginated.items;
    total = paginated.total;
  }

  const result = list as AdminUserList;
  result.total = total;
  return result;
}

export function getAdminStats(): Promise<AdminStats> {
  return request<AdminStats>("/api/admin/stats");
}

export function createOfficial(payload: CreateOfficialPayload): Promise<AdminUser> {
  return request<AdminUser>("/api/admin/officials", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deactivateUser(id: number): Promise<AdminUser> {
  return request<AdminUser>(`/api/admin/users/${id}/deactivate`, {
    method: "POST",
  });
}

export function reactivateUser(id: number): Promise<AdminUser> {
  return request<AdminUser>(`/api/admin/users/${id}/reactivate`, {
    method: "POST",
  });
}

export function updateUserStatus(id: number, is_active: boolean) {
  return request<AdminUser>(`/api/admin/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ is_active }),
  });
}
