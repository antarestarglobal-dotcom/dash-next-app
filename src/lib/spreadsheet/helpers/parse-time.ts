export function parseExcelTimeFraction(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "number") {
    const totalSeconds = Math.round(value * 86400);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  const str = String(value).trim();

  // Already HH:MM or HH:MM:SS
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(str)) {
    const parts = str.split(":");
    const h = parts[0].padStart(2, "0");
    const m = parts[1];
    const s = parts[2] ?? "00";
    return `${h}:${m}:${s}`;
  }

  return null;
}

export function detectHourFromHeader(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "number") {
    if (value === 0) return 0;
    const hour = Math.round(value * 24);
    if (hour >= 0 && hour <= 23) return hour;
    return null;
  }

  const str = String(value).trim();

  // "0:00", "00:00", "1:00", "01:00", "23:00"
  const match = str.match(/^(\d{1,2}):00$/);
  if (match) {
    const hour = parseInt(match[1], 10);
    if (hour >= 0 && hour <= 23) return hour;
  }

  return null;
}
