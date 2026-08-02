import { TvCarousel } from "@/components/tv/TvCarousel";
import { MediaBrowser } from "@/features/media/components/media-browser";
import { fetchTrendingTVShows, safeFetch } from "@/features/media/api";

export default async function TvShowsPage() {
  const trendingTVShows = await safeFetch(() => fetchTrendingTVShows());

  return (
    <>
      <TvCarousel tvshows={trendingTVShows.results ?? []} />

      <main className="min-h-screen bg-[#141414] py-8">
        <div className="container mx-auto px-4">
          <MediaBrowser type="tv" heading="Browse TV shows" />
        </div>
      </main>
    </>
  );
}
