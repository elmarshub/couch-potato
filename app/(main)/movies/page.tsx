import { MovieCarousel } from "@/components/movies/MovieCarousel";
import CategorySection from "@/components/functional/category-section";
import { MediaBrowser } from "@/features/media/components/media-browser";
import { fetchTrendingMovies, safeFetch } from "@/features/media/api";

export default async function MoviesPage() {
  const trendingMovies = await safeFetch(() => fetchTrendingMovies());

  return (
    <>
      <MovieCarousel movies={trendingMovies.results ?? []} />

      <main className="min-h-screen bg-[#141414] py-8">
        <div className="container mx-auto px-4">
          <div className="space-y-8 pb-6">
            <CategorySection title="Trending Now" categoryId="trending" />
          </div>

          <MediaBrowser type="movie" heading="Browse movies" />
        </div>
      </main>
    </>
  );
}
