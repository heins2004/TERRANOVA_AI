const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const SESSION_COOKIE_NAME = "terranova_session";

type AuthMode = "login" | "register";

export type AuthUser = {
  id: number;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
};

export type AuthSuccess = {
  message: string;
  user: AuthUser;
};

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = LoginPayload & {
  full_name: string;
};

type CurrentUserOptions = {
  cookieHeader?: string;
};

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

function getApiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

export async function submitAuth(
  mode: AuthMode,
  payload: LoginPayload | RegisterPayload,
): Promise<AuthSuccess> {
  const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
  const response = await fetch(getApiUrl(endpoint), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as AuthSuccess | { detail?: string };

  if (!response.ok) {
    const errorDetail =
      "detail" in data ? data.detail : "Authentication request failed.";
    throw new Error(errorDetail ?? "Authentication request failed.");
  }

  return data as AuthSuccess;
}

export async function getCurrentUser(
  options: CurrentUserOptions = {},
): Promise<AuthUser | null> {
  const response = await fetch(getApiUrl("/api/auth/me"), {
    method: "GET",
    credentials: "include",
    headers: options.cookieHeader
      ? {
          cookie: options.cookieHeader,
        }
      : undefined,
    cache: "no-store",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Unable to retrieve the authenticated user.");
  }

  return (await response.json()) as AuthUser;
}

export async function logoutUser(): Promise<void> {
  const response = await fetch(getApiUrl("/api/auth/logout"), {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok && response.status !== 204) {
    throw new Error("Unable to log out.");
  }
}
