import { CommentApiError } from "@/services/comments";

export function cleanCommentBody(raw: string): string {
  return raw
    .split("")
    .filter((ch) => ch === "\n" || (ch.charCodeAt(0) >= 32 && ch.charCodeAt(0) !== 127))
    .join("")
    .trim();
}

export function parseCommentError(err: unknown): {
  message: string;
  is401?: boolean;
  is409Closed?: boolean;
} {
  if (err instanceof CommentApiError) {
    if (err.status === 401) {
      return { message: "You must be logged in to comment.", is401: true };
    }
    if (err.status === 409) {
      const msg = err.serverMessage || "";
      if (msg.toLowerCase().includes("closed")) {
        return { message: "Comments are closed for this project.", is409Closed: true };
      }
      if (msg.toLowerCase().includes("identical") || msg.toLowerCase().includes("already")) {
        return { message: "You already posted this comment." };
      }
      return { message: msg };
    }
    if (err.status === 429) {
      const retryAfter = err.retryAfter ?? 60;
      const minutes = Math.max(1, Math.ceil(retryAfter / 60));
      const unit = minutes === 1 ? "minute" : "minutes";
      return {
        message: `You are posting too fast. Try again in ${minutes} ${unit}.`,
      };
    }
    if (err.status === 403) {
      return { message: err.serverMessage };
    }
    if (err.status === 422) {
      return { message: "Check your comment and try again." };
    }
    if (err.status === 0) {
      return { message: "Could not post. Check your connection and try again." };
    }
    return { message: err.serverMessage || "Could not post. Check your connection and try again." };
  }
  return { message: "Could not post. Check your connection and try again." };
}
