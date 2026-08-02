"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { GridSkeleton } from "@/components/general/GridSkeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BrowseCard, BrowseGrid, LoadMore } from "@/features/media/components/browse-card";
import { CATEGORIES } from "@/features/media/categories";
import { useInfiniteMoviesByCategory } from "@/features/media/queries";
import type { MovieCategory } from "@/features/media/types";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

interface CategoryPageClientProps {
  category: MovieCategory;
}

export function CategoryPageClient({ category }: CategoryPageClientProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<MovieCategory>(category);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteMoviesByCategory(selectedCategory);

  const currentCategory = CATEGORIES.find((cat) => cat.id === selectedCategory);
  const allMovies = data?.pages.flatMap((page) => page.results) ?? [];

  function handleSelect(id: MovieCategory) {
    setSelectedCategory(id);
    router.replace(routes.category(id), { scroll: false });
  }

  return (
    <main className="min-h-screen bg-[#141414] text-white">
      <div className="container mx-auto px-4 pb-10 pt-28">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">
            {currentCategory?.label ?? `Category: ${category}`}
          </h1>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex cursor-pointer items-center gap-2 rounded-md border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/10 focus:outline-none">
              {currentCategory && <currentCategory.icon className="size-4" />}
              Browse
              <ChevronDown className="size-4 opacity-70" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="max-h-[70vh] w-56 border-white/10 bg-[#1a1a1a] text-white"
            >
              {CATEGORIES.map((cat) => (
                <DropdownMenuItem
                  key={cat.id}
                  onSelect={() => handleSelect(cat.id)}
                  className={cn(
                    "cursor-pointer gap-2 focus:bg-white/10 focus:text-white",
                    cat.id === selectedCategory && "bg-red-600/90 text-white focus:bg-red-600"
                  )}
                >
                  <cat.icon className="size-4" />
                  {cat.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isLoading ? (
          <GridSkeleton count={18} />
        ) : error ? (
          <p className="text-white/60">
            We couldn&apos;t load these titles. Please try again.
          </p>
        ) : allMovies.length === 0 ? (
          <p className="text-white/60">No movies found in this category.</p>
        ) : (
          <>
            <BrowseGrid>
              {allMovies.map((movie) => (
                <BrowseCard
                  key={movie.id}
                  href={routes.movie(movie.id)}
                  title={movie.title}
                  posterPath={movie.poster_path}
                  rating={movie.vote_average}
                  date={movie.release_date}
                  actionLabel="▶ Play"
                />
              ))}
            </BrowseGrid>

            <LoadMore
              hasNextPage={Boolean(hasNextPage)}
              isFetchingNextPage={isFetchingNextPage}
              onClick={() => fetchNextPage()}
            />
          </>
        )}
      </div>
    </main>
  );
}
