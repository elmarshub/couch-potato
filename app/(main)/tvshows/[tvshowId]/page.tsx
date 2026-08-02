import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { fetchMediaCredits, fetchMediaDetails, fetchMediaVideos } from "@/features/media/api";
import { MediaDetailView } from "@/features/media/components/media-detail-view";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";

interface Props {
  params: Promise<{ tvshowId: string }>;
}

export default async function TvShowDetailsPage({ params }: Props) {
  const { tvshowId } = await params;
  const type = "tv" as const;

  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.media.details(type, tvshowId),
      queryFn: () => fetchMediaDetails(type, tvshowId),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.media.credits(type, tvshowId),
      queryFn: () => fetchMediaCredits(type, tvshowId),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.media.videos(type, tvshowId),
      queryFn: () => fetchMediaVideos(type, tvshowId),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MediaDetailView type={type} id={tvshowId} />
    </HydrationBoundary>
  );
}
