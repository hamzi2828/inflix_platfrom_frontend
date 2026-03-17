const LONDON_TZ = "Europe/London";
const DISPLAY_OPTIONS: Intl.DateTimeFormatOptions = {
  timeZone: LONDON_TZ,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
};

export function formatDateTimeLondon(value: string | number | Date | null | undefined): string {
  if (value == null || value === "") return "—";
  const d = typeof value === "object" && "getTime" in value ? value : new Date(value);
  if (Number.isNaN((d as Date).getTime())) return "—";
  return (d as Date).toLocaleString("en-GB", DISPLAY_OPTIONS);
}
