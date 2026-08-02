"use client";

import { TvCarousel } from "@/components/tv/TvCarousel";
import { usePopularTVShows } from "@/features/media/queries";

export default function CategorySectionTV({ title }: { title: string }) {
  const { data } = usePopularTVShows();
  const shows = data?.results ?? [];

  if (!shows.length) return null;

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-white sm:text-xl md:text-2xl">
        {title}
      </h2>
      <TvCarousel tvshows={shows} />
    </section>
  );
}
