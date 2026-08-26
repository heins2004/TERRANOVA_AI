const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type InfrastructureAsset = {
  id: number; project_id: number | null; name: string; asset_type: string | null; condition: string;
  location_lat: number | null; location_lng: number | null; last_inspected_at: string | null; created_at: string;
};

export type InfrastructureAssetPayload = Omit<InfrastructureAsset, "id" | "created_at">;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { credentials: "include", ...options, headers: { "Content-Type": "application/json", ...options?.headers } });
  if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.detail ?? "Unable to complete the infrastructure request."); }
  return response.json() as Promise<T>;
}

export async function getInfrastructureAssets(filters: { condition?: string } = {}): Promise<InfrastructureAsset[]> {
  const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value) as [string, string][]);
  return request<InfrastructureAsset[]>(`/api/infrastructure${query.size ? `?${query}` : ""}`);
}

export function createInfrastructureAsset(payload: InfrastructureAssetPayload) { return request<InfrastructureAsset>("/api/infrastructure", { method: "POST", body: JSON.stringify(payload) }); }
