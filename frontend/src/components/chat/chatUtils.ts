/**
 * Utility helpers for Chat timestamps and date formatting in IST (Asia/Kolkata).
 */

export function formatISTDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const day = d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric" });
    const month = d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", month: "short" });
    const time = d.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).toLowerCase();
    return `${day} ${month}, ${time}`;
  } catch {
    return dateStr;
  }
}

export function formatDateSeparator(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function getDateKey(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // YYYY-MM-DD
  } catch {
    return dateStr;
  }
}
