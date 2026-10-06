const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type FollowsResponse = {
  project_ids: number[];
};

export type FollowToggleResponse = {
  following: boolean;
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("not logged in");
    }
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail ?? "Unable to complete follow request.");
  }

  return response.status === 204
    ? (undefined as T)
    : (response.json() as Promise<T>);
}

export function getMyFollows(signal?: AbortSignal): Promise<FollowsResponse> {
  return request<FollowsResponse>("/api/me/follows", {
    method: "GET",
    signal,
  });
}

export function followProject(
  id: number,
  signal?: AbortSignal
): Promise<FollowToggleResponse> {
  return request<FollowToggleResponse>(`/api/projects/${id}/follow`, {
    method: "PUT",
    signal,
  });
}

export function unfollowProject(
  id: number,
  signal?: AbortSignal
): Promise<FollowToggleResponse> {
  return request<FollowToggleResponse>(`/api/projects/${id}/follow`, {
    method: "DELETE",
    signal,
  });
}
