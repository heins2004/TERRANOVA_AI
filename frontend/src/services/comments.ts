import { PublicComment } from "./publicProjects";
import { API_BASE_URL } from "@/lib/config";

export class CommentApiError extends Error {
  status: number;
  serverMessage: string;
  retryAfter: number | null;

  constructor(status: number, serverMessage: string, retryAfter: number | null = null) {
    super(serverMessage);
    this.name = "CommentApiError";
    this.status = status;
    this.serverMessage = serverMessage;
    this.retryAfter = retryAfter;
  }
}

export type PostCommentPayload = {
  body: string;
  stance?: string | null;
  parent_id?: number | null;
};

export async function postComment(
  projectId: number,
  payload: PostCommentPayload,
  signal?: AbortSignal
): Promise<PublicComment> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/comments`, {
      method: "POST",
      credentials: "include",
      signal,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw err;
    }
    throw new CommentApiError(0, "Could not post. Check your connection and try again.");
  }

  if (response.status === 201) {
    return (await response.json()) as PublicComment;
  }

  const retryAfterHeader = response.headers.get("Retry-After");
  const parsedRetry = retryAfterHeader ? parseInt(retryAfterHeader, 10) : null;
  const retryAfter = parsedRetry !== null && !Number.isNaN(parsedRetry) ? parsedRetry : null;

  let serverMessage = `Request failed with status ${response.status}`;
  try {
    const errorBody = await response.json();
    if (errorBody && errorBody.detail) {
      if (typeof errorBody.detail === "string") {
        serverMessage = errorBody.detail;
      } else if (Array.isArray(errorBody.detail) && errorBody.detail.length > 0) {
        serverMessage = errorBody.detail[0]?.msg ?? JSON.stringify(errorBody.detail);
      }
    }
  } catch {
    // ignore parse failure
  }

  throw new CommentApiError(response.status, serverMessage, retryAfter);
}

export async function deleteComment(
  commentId: number,
  signal?: AbortSignal
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/comments/${commentId}`, {
      method: "DELETE",
      credentials: "include",
      signal,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw err;
    }
    throw new CommentApiError(0, "Could not delete comment. Check your connection and try again.");
  }

  if (response.status === 204) {
    return;
  }

  let serverMessage = `Request failed with status ${response.status}`;
  try {
    const errorBody = await response.json();
    if (errorBody && errorBody.detail) {
      if (typeof errorBody.detail === "string") {
        serverMessage = errorBody.detail;
      } else if (Array.isArray(errorBody.detail) && errorBody.detail.length > 0) {
        serverMessage = errorBody.detail[0]?.msg ?? JSON.stringify(errorBody.detail);
      }
    }
  } catch {
    // ignore parse failure
  }

  throw new CommentApiError(response.status, serverMessage);
}

