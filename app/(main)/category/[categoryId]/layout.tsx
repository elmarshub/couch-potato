import type { Metadata } from "next";
import { fetchMoviesByCategory } from "@/features/media/api";
import type { MovieCategory } from "@/features/media/types";
import { generateCategoryMetadata } from "@/lib/metadata";

type Props = {
  params: Promise<{ categoryId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoryId } = await params;

  try {
    const data = await fetchMoviesByCategory(categoryId as MovieCategory, 1);
    return generateCategoryMetadata(categoryId, data.results);
  } catch (error) {
    console.error("Failed to fetch category metadata:", error);
    return {
      title: "Category Not Found",
      description: "The requested category could not be found.",
    };
  }
}

export default function CategoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
