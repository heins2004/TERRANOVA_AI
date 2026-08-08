const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

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
    throw new Error(data.detail ?? "Authentication request failed.");
  }

  return data as AuthSuccess;
}
