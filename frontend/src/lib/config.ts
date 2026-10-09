/**
 * Shared API base URL, resolved once at module load.
 *
 * Rules:
 *  - If NEXT_PUBLIC_API_BASE_URL is set, use it (trailing slash stripped).
 *  - If it is unset and NODE_ENV is "production", throw at build time so the
 *    build fails loudly instead of shipping a localhost URL to production.
 *  - If it is unset in development, fall back to http://localhost:8000.
 */
const raw = process.env.NEXT_PUBLIC_API_BASE_URL;

function resolveApiBaseUrl(): string {
  if (raw) {
    return raw.replace(/\/$/, "");
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL must be set when building for production. " +
        "Add it to your .env file or CI environment variables before running `next build`."
    );
  }
  return "http://localhost:8000";
}

export const API_BASE_URL: string = resolveApiBaseUrl();
