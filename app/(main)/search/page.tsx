"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GridSkeleton } from "@/components/general/GridSkeleton";
import {
  BrowseCard,
  BrowseGrid,
} from "@/features/media/components/browse-card";
import { useSearch, useTrending } from "@/features/media/queries";
import type { SearchResult } from "@/features/media/types";
import { routes } from "@/lib/routes";

function resultHref(item: SearchResult) {
  return item.media_type === "person"
    ? routes.person(item.id)
    : routes.media(item.media_type, item.id);
}

function toBrowseCardProps(item: SearchResult) {
  const isPerson = item.media_type === "person";
  return {
    href: resultHref(item),
    title: item.title ?? item.name ?? "Untitled",
    posterPath: isPerson ? item.profile_path : item.poster_path,
    rating: item.vote_average,
    date: item.release_date ?? item.first_air_date,
    actionLabel: isPerson
      ? "View Profile"
      : item.media_type === "tv"
        ? "▶ Watch"
        : "▶ Play",
  };
}

export default function SearchPage() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => setQuery(input.trim()), 300);
    return () => clearTimeout(t);
  }, [input]);

  useEffect(() => {
    setFocusedIndex(-1);
  }, [query]);

  const isSearching = query.length > 0;
  const {
    data: searchResults,
    isLoading: searchLoading,
    isFetching: searchFetching,
  } = useSearch(query, 1);
  const { data: trending, isLoading: trendingLoading } = useTrending("week");

  const items = useMemo(() => {
    if (isSearching) return searchResults ?? [];
    return (trending ?? []).filter((item) => item.media_type !== "person");
  }, [isSearching, searchResults, trending]);

  const isLoading = isSearching ? searchLoading : trendingLoading;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!items.length) return;
      const cols = 6;
      if (e.key === "ArrowRight")
        setFocusedIndex((i) => Math.min(i + 1, items.length - 1));
      if (e.key === "ArrowLeft") setFocusedIndex((i) => Math.max(i - 1, 0));
      if (e.key === "ArrowDown")
        setFocusedIndex((i) =>
          Math.min((i < 0 ? 0 : i) + cols, items.length - 1),
        );
      if (e.key === "ArrowUp")
        setFocusedIndex((i) => Math.max((i < 0 ? 0 : i) - cols, 0));
      if (e.key === "Enter" && focusedIndex >= 0) {
        router.push(resultHref(items[focusedIndex]));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items, focusedIndex, router]);

  return (
    <main className="min-h-screen bg-[#141414] text-white">
      <div className="container mx-auto px-4 pt-28 pb-10">
        <div className="max-w-3xl mx-auto mb-8">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search for movies, TV shows..."
            autoFocus
            className="w-full bg-white/10 border border-white/10 rounded-md px-4 py-3 outline-none focus:border-white/30 placeholder:text-white/50"
          />
        </div>

        <h2 className="mb-4 text-lg font-semibold text-white/90">
          {isSearching ? `Results for "${query}"` : ""}
        </h2>

        {isLoading ? (
          <GridSkeleton count={18} />
        ) : items.length === 0 ? (
          <p className="text-white/60">No results for &quot;{query}&quot;.</p>
        ) : (
          <div
            className={`transition-opacity ${
              isSearching && searchFetching ? "opacity-60" : "opacity-100"
            }`}
          >
            <BrowseGrid>
              {items.map((item, i) => (
                <BrowseCard
                  key={`${item.media_type}-${item.id}`}
                  highlighted={focusedIndex === i}
                  {...toBrowseCardProps(item)}
                />
              ))}
            </BrowseGrid>
          </div>
        )}
      </div>
    </main>
  );
}
