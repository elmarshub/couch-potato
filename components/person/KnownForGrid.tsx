"use client";

import Image from "next/image";
import Link from "next/link";
import { getImageUrl } from "@/lib/format";

import type { PersonCredit } from "@/features/media/types";
import { routes } from "@/lib/routes";

export default function KnownForGrid({ items }: { items: PersonCredit[] }) {
  if (!items?.length) return null;
  const byMedia = new Map<string, PersonCredit>();
  for (const c of items) {
    const key = `${c.media_type}-${c.id}`;
    const existing = byMedia.get(key);
    if (!existing || c.popularity > existing.popularity) byMedia.set(key, c);
  }
  const sorted = [...byMedia.values()].sort((a, b) => b.popularity - a.popularity);
  return (
    <div className="mt-10">
      <h2 className="text-2xl font-semibold mb-4">Known For</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {sorted.slice(0, 18).map((c) => (
          <Link
            key={`${c.media_type}-${c.id}`}
            href={routes.media(c.media_type, c.id)}
            prefetch
            className="group"
          >
            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
              <Image
                src={getImageUrl(c.poster_path ?? null, "w500")}
                alt={c.title ?? c.name ?? ""}
                fill
                unoptimized
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="mt-2 text-sm font-medium line-clamp-1">{c.title ?? c.name}</div>
            {c.character && (
              <div className="text-xs text-gray-400 line-clamp-1">as {c.character}</div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
