import type { Metadata } from "next";
import { fetchMediaDetails } from "@/features/media/api";
import { generateMovieMetadata } from "@/lib/metadata";

type Props = {
  params: Promise<{ tvshowId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tvshowId } = await params;

  try {
    const tvshow = await fetchMediaDetails("tv", tvshowId);
    return generateMovieMetadata(tvshow);
  } catch (error) {
    console.error("Failed to fetch TV show metadata:", error);
    return {
      title: "TV Show Not Found",
      description: "The requested TV show could not be found.",
    };
  }
}

export default function TVShowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
