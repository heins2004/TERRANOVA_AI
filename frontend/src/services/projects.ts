const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type Project = {
  id: number; title: string; description: string | null; status: string; category: string | null;
  location_lat: number | null; location_lng: number | null; budget: string | number | null;
  start_date: string | null; end_date: string | null; created_by: number; created_at: string; updated_at: string;
};

export type ProjectPayload = Omit<Project, "id" | "created_by" | "created_at" | "updated_at">;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { credentials: "include", ...options, headers: { "Content-Type": "application/json", ...options?.headers } });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail ?? "Unable to complete the project request.");
  }
  return response.status === 204 ? (undefined as T) : response.json() as Promise<T>;
}

export function getProjects(filters: { status?: string; category?: string } = {}) {
  const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value) as [string, string][]);
  return request<Project[]>(`/api/projects${query.size ? `?${query}` : ""}`);
}
export function getProject(id: number) { return request<Project>(`/api/projects/${id}`); }
export function createProject(payload: ProjectPayload) { return request<Project>("/api/projects", { method: "POST", body: JSON.stringify(payload) }); }
export function updateProject(id: number, payload: Partial<ProjectPayload>) { return request<Project>(`/api/projects/${id}`, { method: "PATCH", body: JSON.stringify(payload) }); }
