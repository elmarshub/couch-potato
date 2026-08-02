import { LibraryPageClient } from "./library-page-client";

interface LibraryPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const { tab } = await searchParams;
  const initialTab = tab === "watchlist" ? "watchlist" : "favorites";

  return <LibraryPageClient initialTab={initialTab} />;
}
