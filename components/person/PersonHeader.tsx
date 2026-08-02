"use client";

import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { calculateAge, formatDate, getImageUrl } from "@/lib/format";
import type { ExternalIds } from "@/features/media/types";

interface PersonHeaderProps {
  name: string;
  profilePath: string | null;
  biography?: string | null;
  birthday?: string | null;
  deathday?: string | null;
  placeOfBirth?: string | null;
  knownForDepartment?: string;
  externalIds?: ExternalIds;
}

export default function PersonHeader({
  name,
  profilePath,
  biography,
  birthday,
  deathday,
  placeOfBirth,
  knownForDepartment,
  externalIds,
}: PersonHeaderProps) {
  const age = calculateAge(birthday, deathday);

  return (
    <div className="flex gap-6 flex-col md:flex-row">
      <div className="w-40 h-56 relative rounded overflow-hidden bg-gray-800 flex-shrink-0">
        <Image
          src={getImageUrl(profilePath, "w500")}
          alt={name}
          fill
          className="object-cover"
        />
      </div>
      <div className="flex-1">
        <h1 className="text-3xl font-bold mb-2">{name}</h1>

        <div className="flex flex-wrap gap-2 mb-4">
          {knownForDepartment && (
            <span className="px-3 py-1 text-xs rounded-full bg-white/10 text-gray-200">
              {knownForDepartment}
            </span>
          )}
          {externalIds?.imdb_id && (
            <a
              href={`https://www.imdb.com/name/${externalIds.imdb_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1 text-xs rounded-full bg-white/10 text-gray-200 hover:bg-white/20 transition"
            >
              IMDb <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-4 text-sm">
          {birthday && (
            <div>
              <dt className="text-gray-400">{deathday ? "Born" : "Birthday"}</dt>
              <dd>
                {formatDate(birthday)}
                {age !== null && !deathday && ` (${age} years old)`}
              </dd>
            </div>
          )}
          {deathday && (
            <div>
              <dt className="text-gray-400">Died</dt>
              <dd>
                {formatDate(deathday)}
                {age !== null && ` (aged ${age})`}
              </dd>
            </div>
          )}
          {placeOfBirth && (
            <div>
              <dt className="text-gray-400">Place of Birth</dt>
              <dd>{placeOfBirth}</dd>
            </div>
          )}
        </dl>

        {biography && (
          <p className="text-white/80 leading-relaxed whitespace-pre-line">
            {biography}
          </p>
        )}
      </div>
    </div>
  );
}
