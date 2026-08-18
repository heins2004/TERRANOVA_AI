const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export const userRoles = ["Citizen", "Urban Planner", "Government Official", "Administrator"] as const;
export type UserRole = (typeof userRoles)[number];

export type AdminUser = {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail ?? "Unable to complete the user management request.");
  }
  return response.json() as Promise<T>;
}

export function getUsers() { return request<AdminUser[]>("/api/admin/users"); }
export function updateUserRole(id: number, role: UserRole) { return request<AdminUser>(`/api/admin/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) }); }
export function updateUserStatus(id: number, is_active: boolean) { return request<AdminUser>(`/api/admin/users/${id}/status`, { method: "PATCH", body: JSON.stringify({ is_active }) }); }
