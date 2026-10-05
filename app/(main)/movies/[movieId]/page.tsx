import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { fetchMediaCredits, fetchMediaDetails, fetchMediaVideos } from "@/features/media/api";
import { MediaDetailView } from "@/features/media/components/media-detail-view";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";

export const revalidate = 86400;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

interface Props {
  params: Promise<{ movieId: string }>;
}

export default async function MovieDetailsPage({ params }: Props) {
  const { movieId } = await params;
  const type = "movie" as const;

  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.media.details(type, movieId),
      queryFn: () => fetchMediaDetails(type, movieId),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.media.credits(type, movieId),
      queryFn: () => fetchMediaCredits(type, movieId),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.media.videos(type, movieId),
      queryFn: () => fetchMediaVideos(type, movieId),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MediaDetailView type={type} id={movieId} />
    </HydrationBoundary>
  );
}
