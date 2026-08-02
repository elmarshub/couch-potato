"use client";

import { useGenres } from "@/features/media/queries";
import type { MediaType } from "@/features/media/types";

interface GenreFilterProps {
  type: MediaType;
  value?: string;
  onChange: (genreId: string | undefined) => void;
}

export function GenreFilter({ type, value, onChange }: GenreFilterProps) {
  const { data: genres, isLoading } = useGenres(type);

  return (
    <div className="mb-6 flex items-center gap-3">
      <label htmlFor={`genre-${type}`} className="text-sm text-white/80">
        Genre
      </label>
      <select
        id={`genre-${type}`}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value || undefined)}
        className="cursor-pointer rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none"
      >
        <option value="" className="bg-[#141414]">
          All
        </option>
        {(genres ?? []).map((genre) => (
          <option key={genre.id} value={String(genre.id)} className="bg-[#141414]">
            {genre.name}
          </option>
        ))}
      </select>
      {isLoading && <span className="text-xs text-white/50">Loading...</span>}
    </div>
  );
}
