const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type InfrastructureAsset = {
  id: number; project_id: number | null; name: string; asset_type: string | null; condition: string;
  location_lat: number | null; location_lng: number | null; last_inspected_at: string | null; created_at: string;
};

export async function getInfrastructureAssets(filters: { condition?: string } = {}): Promise<InfrastructureAsset[]> {
  const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value) as [string, string][]);
  const response = await fetch(`${API_BASE_URL}/api/infrastructure${query.size ? `?${query}` : ""}`, { credentials: "include" });
  if (!response.ok) throw new Error("Unable to load infrastructure assets.");
  return response.json();
}
