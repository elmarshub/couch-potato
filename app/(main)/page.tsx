import type { Metadata } from "next";
import { CategoryCarousel } from "@/components/functional/category-carousel";
import { HeroCarousel } from "@/components/main/herocarousel";
import {
  fetchMoviesByCategory,
  fetchNowPlayingMovies,
  safeFetch,
} from "@/features/media/api";
import HomeInfiniteFeed from "@/components/functional/home-infinite-feed";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Discover the latest movies and TV shows. Browse trending content, popular films, and find your next favorite entertainment on Couch Potato.",
  keywords: [
    "movies",
    "TV shows",
    "trending",
    "popular",
    "entertainment",
    "streaming",
    "discover",
  ],
  openGraph: {
    title: "Couch Potato - Discover Movies & TV Shows",
    description:
      "Discover the latest movies and TV shows. Browse trending content, popular films, and find your next favorite entertainment.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Couch Potato - Discover Movies & TV Shows",
    description:
      "Discover the latest movies and TV shows. Browse trending content, popular films, and find your next favorite entertainment.",
  },
};

export default async function HomePage() {
  const nowPlaying = await safeFetch(() => fetchNowPlayingMovies());

  const [trending, hollywood, popular, topRated, action, horror, animation] =
    await Promise.all([
      safeFetch(() => fetchMoviesByCategory("trending")),
      safeFetch(() => fetchMoviesByCategory("hollywood")),
      safeFetch(() => fetchMoviesByCategory("popular")),
      safeFetch(() => fetchMoviesByCategory("top-rated")),
      safeFetch(() => fetchMoviesByCategory("action")),
      safeFetch(() => fetchMoviesByCategory("horror")),
      safeFetch(() => fetchMoviesByCategory("animation")),
    ]);

  return (
    <main className="mx-auto">
      <HeroCarousel movies={nowPlaying.results} />

      <div className="space-y-8 pb-16">
        <CategoryCarousel
          title="Trending Now"
          movies={trending.results.slice(0, 15)}
          categoryId="trending"
        />
        <CategoryCarousel
          title="Hollywood Movie"
          movies={hollywood.results.slice(0, 15)}
          categoryId="hollywood"
        />
        <CategoryCarousel
          title="Popular Movies"
          movies={popular.results.slice(0, 15)}
          categoryId="popular"
        />
        <CategoryCarousel
          title="Top Rated"
          movies={topRated.results.slice(0, 15)}
          categoryId="top-rated"
        />
        <CategoryCarousel
          title="Action Movies"
          movies={action.results.slice(0, 15)}
          categoryId="action"
        />
        <CategoryCarousel
          title="Horror Movies"
          movies={horror.results.slice(0, 15)}
          categoryId="horror"
        />
        <CategoryCarousel
          title="Animation"
          movies={animation.results.slice(0, 15)}
          categoryId="animation"
        />
      </div>

      <div className="container mx-auto px-4 pb-24">
        <HomeInfiniteFeed />
      </div>
    </main>
  );
}
