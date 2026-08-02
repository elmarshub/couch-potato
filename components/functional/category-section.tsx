"use client";

import { CategoryCarousel } from "@/components/functional/category-carousel";
import { useMoviesByCategory } from "@/features/media/queries";
import type { MovieCategory } from "@/features/media/types";

interface CategorySectionProps {
  title: string;
  categoryId: MovieCategory;
}

export default function CategorySection({
  title,
  categoryId,
}: CategorySectionProps) {
  const { data } = useMoviesByCategory(categoryId);
  const movies = data?.results ?? [];

  if (!movies.length) return null;

  return (
    <CategoryCarousel
      title={title}
      movies={movies.slice(0, 15)}
      categoryId={categoryId}
    />
  );
}
