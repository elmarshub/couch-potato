export function getImageUrl(
  path: string | null | undefined,
  size: "w200" | "w500" | "w780" | "w1280" | "original" = "original"
): string {
  if (!path) return "/placeholder.png";
  return `https://image.tmdb.org/t/p/${size}${
    path.startsWith("/") ? path : `/${path}`
  }`;
}

export function getYear(date: string | null | undefined): string {
  if (!date) return "";
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? "" : String(parsed.getFullYear());
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return "Unknown";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Unknown";
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatRating(rating: number | null | undefined): string {
  if (typeof rating !== "number" || Number.isNaN(rating)) return "N/A";
  return rating.toFixed(1);
}

export function formatRuntime(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return "";
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder}m`;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

export function calculateAge(
  birthday: string | null | undefined,
  until: string | null | undefined = null
): number | null {
  if (!birthday) return null;
  const born = new Date(birthday);
  const end = until ? new Date(until) : new Date();
  if (Number.isNaN(born.getTime()) || Number.isNaN(end.getTime())) return null;

  let age = end.getFullYear() - born.getFullYear();
  const monthDiff = end.getMonth() - born.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < born.getDate())) {
    age -= 1;
  }
  return age;
}
