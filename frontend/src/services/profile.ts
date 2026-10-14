import { API_BASE_URL } from "@/lib/config";

export type RoleCounts =
  | {
      follows: number;
      comments: number;
    }
  | {
      pending_invites: number;
      assigned_projects_by_stage: Record<string, number>;
    }
  | {
      own_projects_by_stage: Record<string, number>;
    }
  | null;

export type UserProfile = {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  city: string | null;
  created_at: string;
  organization: string | null;
  designation: string | null;
  expertise: string | null;
  avatar_key: string;
  counts: RoleCounts;
};

export type FollowingItem = {
  id: number;
  title: string;
  category: string | null;
  city_name: string | null;
  stage: string;
  days_left: number | null;
  halt_reason: string | null;
  followed_at: string;
};

export type FollowingResponse = {
  items: FollowingItem[];
  total: number;
};

export type UserComment = {
  id: number;
  project_id: number;
  project_title: string;
  stance: string | null;
  body: string;
  created_at: string;
  can_delete: boolean;
};

export type UserCommentsResponse = {
  items: UserComment[];
  total: number;
};

export async function getProfile(): Promise<UserProfile> {
  const res = await fetch(`${API_BASE_URL}/api/me/profile`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to fetch profile");
  }
  return res.json();
}

export async function updateProfile(
  payload: Record<string, unknown>,
): Promise<UserProfile> {
  const res = await fetch(`${API_BASE_URL}/api/me/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to update profile");
  }
  return res.json();
}

export async function changePassword(payload: {
  current_password: string;
  new_password: string;
}): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/me/password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to change password");
  }
  return res.json();
}

export async function getFollowingProjects(
  limit: number = 10,
  offset: number = 0,
): Promise<FollowingResponse> {
  const res = await fetch(
    `${API_BASE_URL}/api/me/following?limit=${limit}&offset=${offset}`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    },
  );
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to fetch following projects");
  }
  return res.json();
}

export async function getMyComments(
  limit: number = 10,
  offset: number = 0,
): Promise<UserCommentsResponse> {
  const res = await fetch(
    `${API_BASE_URL}/api/me/comments?limit=${limit}&offset=${offset}`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    },
  );
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to fetch comments");
  }
  return res.json();
}

export async function unfollowProject(projectId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/follow`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to unfollow project");
  }
}

export async function deleteComment(commentId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/comments/${commentId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to delete comment");
  }
}
