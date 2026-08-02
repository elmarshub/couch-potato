const AVATAR_COLORS = [
  "#E50914",
  "#B81D24",
  "#C0392B",
  "#8E44AD",
  "#2980B9",
  "#16A085",
  "#D35400",
  "#2C3E50",
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getInitials(
  name: string | null | undefined,
  email: string | null | undefined
): string {
  const trimmedName = name?.trim();
  if (trimmedName) {
    const initials = trimmedName
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .join("")
      .toUpperCase()
      .slice(0, 2);
    if (initials) return initials;
  }

  const trimmedEmail = email?.trim();
  return trimmedEmail ? trimmedEmail[0].toUpperCase() : "?";
}

export function getAvatarColor(seed: string | null | undefined): string {
  if (!seed) return AVATAR_COLORS[0];
  return AVATAR_COLORS[hashString(seed) % AVATAR_COLORS.length];
}

export function getAvatarUrl(
  email: string | null | undefined,
  name?: string | null,
  size: number = 40
): string {
  const initials = getInitials(name, email);
  const background = getAvatarColor(email ?? name ?? "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="${background}"/><text x="50%" y="50%" dy=".35em" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="${Math.round(
    size * 0.42
  )}" font-weight="600">${initials}</text></svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
