import { Suspense } from "react";
import { CategoryPageClient } from "./category-page-client";
import type { MovieCategory } from "@/features/media/types";

interface CategoryPageProps {
  params: Promise<{ categoryId: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { categoryId } = await params;
  const category = categoryId as MovieCategory;

  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <CategoryPageClient key={category} category={category} />
    </Suspense>
  );
}
