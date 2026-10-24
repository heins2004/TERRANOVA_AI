export function getKolkataToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

export function parseDateOnly(val?: string | null): string | null {
  if (!val) return null;
  const trimmed = val.trim();
  if (!trimmed) return null;
  return trimmed.split("T")[0];
}

export function getISTDatePart(val?: string | null): string {
  if (!val) return "";
  const trimmed = val.trim();
  if (!trimmed) return "";
  if (!trimmed.includes("T")) {
    return trimmed.split(" ")[0];
  }
  const d = new Date(trimmed);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

export function getISTTimePart(val?: string | null): string {
  if (!val) return "";
  const trimmed = val.trim();
  if (!trimmed) return "";
  if (!trimmed.includes("T")) {
    return "12:00";
  }
  const d = new Date(trimmed);
  if (isNaN(d.getTime())) return "12:00";
  return d.toLocaleTimeString("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function buildISTISOString(datePart: string, timePart?: string): string {
  if (!datePart) return "";
  const time = timePart && timePart.trim() ? timePart.trim() : "12:00";
  const fullTime = time.length === 5 ? `${time}:00` : time;
  return `${datePart}T${fullTime}+05:30`;
}

export function toISTTimestamp(val?: string | null): number | null {
  if (!val) return null;
  const trimmed = val.trim();
  if (!trimmed) return null;
  if (!trimmed.includes("T")) {
    const iso = `${trimmed}T12:00:00+05:30`;
    const t = new Date(iso).getTime();
    return isNaN(t) ? null : t;
  }
  const t = new Date(trimmed).getTime();
  return isNaN(t) ? null : t;
}

export function isDateInPast(val?: string | null): boolean {
  const d = getISTDatePart(val);
  if (!d) return false;
  return d < getKolkataToday();
}

export function isEndAfterStart(startDate?: string | null, endDate?: string | null): boolean {
  const s = toISTTimestamp(startDate);
  const e = toISTTimestamp(endDate);
  if (s == null || e == null) return true;
  return e > s;
}

export function isStartDateAfterDeadline(startDate?: string | null, deadline?: string | null): boolean {
  const s = toISTTimestamp(startDate);
  const d = toISTTimestamp(deadline);
  if (s == null || d == null) return false;
  return s > d;
}

export function formatISTDateTime(val?: string | Date | null): string {
  if (!val) return "";
  try {
    const d = typeof val === "string" ? new Date(val) : val;
    if (isNaN(d.getTime())) return String(val);
    const datePart = d.toLocaleDateString("en-GB", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const timePart = d
      .toLocaleTimeString("en-US", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .toLowerCase();
    return `${datePart}, ${timePart} IST`;
  } catch {
    return String(val);
  }
}

