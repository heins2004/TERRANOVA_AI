const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const SESSION_COOKIE_NAME = "terranova_session";
const TOKEN_STORAGE_KEY = "terranova_token";
const USER_STORAGE_KEY = "terranova_user";

type AuthMode = "login" | "register";

export type AuthSuccess = {
  message: string;
  access_token: string;
  user: {
    id: number;
    full_name: string;
    email: string;
    created_at: string;
  };
};

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = LoginPayload & {
  full_name: string;
};

export type AuthUser = AuthSuccess["user"];

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export function persistAuthSession(payload: AuthSuccess) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(TOKEN_STORAGE_KEY, payload.access_token);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(payload.user));
  document.cookie = `${SESSION_COOKIE_NAME}=1; path=/; max-age=604800; samesite=lax`;
}

export function clearAuthSession() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
  document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
}

export function getStoredUser() {
  if (typeof window === "undefined") {
    return null;
  }

  const storedUser = localStorage.getItem(USER_STORAGE_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as AuthUser;
  } catch {
    clearAuthSession();
    return null;
  }
}

export function hasStoredSession() {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(localStorage.getItem(TOKEN_STORAGE_KEY) && getStoredUser());
}

export async function submitAuth(
  mode: AuthMode,
  payload: LoginPayload | RegisterPayload,
): Promise<AuthSuccess> {
  const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
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
