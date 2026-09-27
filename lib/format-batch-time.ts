export function formatBatchTime(value?: string, fallback = "Not assigned"): string {
  if (!value?.trim()) return fallback;

  const match = /^(?:[01]\d|2[0-3]):[0-5]\d$/.exec(value.trim());
  if (!match) return value.trim();

  const [hourText, minute] = value.trim().split(":");
  const hour24 = Number(hourText);
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return `${String(hour12).padStart(2, "0")}:${minute} ${period}`;
}