import type { Metadata } from "next";
import { fetchMediaDetails } from "@/features/media/api";
import { generateMovieMetadata } from "@/lib/metadata";

type Props = {
  params: Promise<{ movieId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { movieId } = await params;

  try {
    const movie = await fetchMediaDetails("movie", movieId);
    return generateMovieMetadata(movie);
  } catch (error) {
    console.error("Failed to fetch movie metadata:", error);
    return {
      title: "Movie Not Found",
      description: "The requested movie could not be found.",
    };
  }
}

export default function MovieLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
