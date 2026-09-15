const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type City = { slug: string; name: string; lat: number; lng: number };

export async function getCities(): Promise<City[]> {
  const response = await fetch(`${API_BASE_URL}/api/cities`, { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load supported cities.");
  return response.json() as Promise<City[]>;
}
