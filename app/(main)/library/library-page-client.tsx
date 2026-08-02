"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bookmark, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LIBRARY_PAGE_SIZE,
  LibraryGrid,
} from "@/features/library/components/library-grid";
import { useFavorites, useWatchlist } from "@/features/library/queries";
import { routes } from "@/lib/routes";

type LibraryTab = "favorites" | "watchlist";

interface LibraryPageClientProps {
  initialTab: LibraryTab;
}

export function LibraryPageClient({ initialTab }: LibraryPageClientProps) {
  const router = useRouter();
  const [tab, setTab] = useState<LibraryTab>(initialTab);
  const [favoritesPage, setFavoritesPage] = useState(1);
  const [watchlistPage, setWatchlistPage] = useState(1);

  const favorites = useFavorites();
  const watchlist = useWatchlist();

  function handleTabChange(value: string) {
    const next = value as LibraryTab;
    setTab(next);
    router.replace(routes.libraryTab(next), { scroll: false });
  }

  const tabSwitcher = (
    <Tabs value={tab} onValueChange={handleTabChange}>
      <TabsList className="bg-white/5">
        <TabsTrigger
          value="favorites"
          className="gap-2 data-[state=active]:bg-red-600 cursor-pointer data-[state=active]:text-white"
        >
          <Heart className="size-4" />
          Favorites
        </TabsTrigger>
        <TabsTrigger
          value="watchlist"
          className="gap-2 data-[state=active]:bg-red-600 cursor-pointer data-[state=active]:text-white"
        >
          <Bookmark className="size-4" />
          Watchlist
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );

  if (tab === "watchlist") {
    return (
      <LibraryGrid
        title="My Library"
        headerExtra={tabSwitcher}
        items={watchlist.data}
        isLoading={watchlist.isLoading}
        isError={watchlist.isError}
        emptyMessage="Your watchlist is empty."
        emptyAction={
          <Button asChild className="bg-red-600 hover:bg-red-700">
            <Link href={routes.tvshows}>Browse TV shows</Link>
          </Button>
        }
        page={watchlistPage}
        pageSize={LIBRARY_PAGE_SIZE}
        onPageChange={setWatchlistPage}
      />
    );
  }

  return (
    <LibraryGrid
      title="My Library"
      headerExtra={tabSwitcher}
      items={favorites.data}
      isLoading={favorites.isLoading}
      isError={favorites.isError}
      emptyMessage="You haven't liked anything yet."
      emptyAction={
        <Button asChild className="bg-red-600 hover:bg-red-700">
          <Link href={routes.movies}>Browse movies</Link>
        </Button>
      }
      page={favoritesPage}
      pageSize={LIBRARY_PAGE_SIZE}
      onPageChange={setFavoritesPage}
    />
  );
}
