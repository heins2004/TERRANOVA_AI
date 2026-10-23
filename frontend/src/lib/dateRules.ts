export function getKolkataToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

export function parseDateOnly(val?: string | null): string | null {
  if (!val) return null;
  const trimmed = val.trim();
  if (!trimmed) return null;
  return trimmed.split("T")[0];
}

export function isDateInPast(dateStr?: string | null): boolean {
  const d = parseDateOnly(dateStr);
  if (!d) return false;
  return d < getKolkataToday();
}

export function isEndAfterStart(startDate?: string | null, endDate?: string | null): boolean {
  const s = parseDateOnly(startDate);
  const e = parseDateOnly(endDate);
  if (!s || !e) return true;
  return e > s;
}

export function isStartDateAfterDeadline(startDate?: string | null, deadline?: string | null): boolean {
  const s = parseDateOnly(startDate);
  const d = parseDateOnly(deadline);
  if (!s || !d) return false;
  return s > d;
}
