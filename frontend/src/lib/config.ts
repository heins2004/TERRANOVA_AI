/**
 * Shared API base URL.
 *
 * Rules:
 *  - Uses NEXT_PUBLIC_API_BASE_URL if set (trailing slash stripped).
 *  - Defaults to empty string, meaning same-origin relative /api/... calls.
 */
function resolveApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (raw && raw.trim() !== "") {
    return raw.trim().replace(/\/$/, "");
  }
  return "";
}

export const API_BASE_URL: string = resolveApiBaseUrl();
