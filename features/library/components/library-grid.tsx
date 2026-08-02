"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMediaDetails } from "@/features/media/queries";
import type { MediaType } from "@/features/media/types";
import { getImageUrl } from "@/lib/format";
import { routes } from "@/lib/routes";
import { GridSkeleton } from "@/components/general/GridSkeleton";
import type { LibraryItem } from "../types";

export const LIBRARY_PAGE_SIZE = 18;

function LibraryCard({
  mediaType,
  mediaId,
}: {
  mediaType: MediaType;
  mediaId: number;
}) {
  const { data, isLoading, isError } = useMediaDetails(mediaType, String(mediaId));
  const title = data?.title ?? data?.name ?? "";

  if (isLoading) {
    return (
      <div className="aspect-[2/3] animate-pulse rounded-lg bg-white/10" />
    );
  }

  if (isError) {
    return (
      <div className="flex aspect-[2/3] items-center justify-center rounded-lg bg-white/5 p-3 text-center text-xs text-white/50">
        Unavailable
      </div>
    );
  }

  return (
    <Link href={routes.media(mediaType, mediaId)} className="group">
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-gray-800">
        <Image
          src={getImageUrl(data?.poster_path, "w500")}
          alt={title || "Poster"}
          fill
          unoptimized
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="mt-2 line-clamp-1 text-sm">{title}</div>
    </Link>
  );
}

interface LibraryGridProps {
  title: string;
  items: LibraryItem[] | undefined;
  isLoading: boolean;
  isError: boolean;
  emptyMessage: string;
  emptyAction?: React.ReactNode;
  headerExtra?: React.ReactNode;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}

export function LibraryGrid({
  title,
  items,
  isLoading,
  isError,
  emptyMessage,
  emptyAction,
  headerExtra,
  page = 1,
  pageSize = LIBRARY_PAGE_SIZE,
  onPageChange,
}: LibraryGridProps) {
  const totalPages = items ? Math.max(1, Math.ceil(items.length / pageSize)) : 1;
  const pageItems = items?.slice((page - 1) * pageSize, page * pageSize);

  return (
    <main className="min-h-screen bg-[#141414] text-white">
      <div className="container mx-auto px-4 pb-10 pt-28">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">{title}</h1>
          {headerExtra}
        </div>

        {isLoading ? (
          <GridSkeleton count={12} />
        ) : isError ? (
          <p className="text-white/60">
            We couldn&apos;t load this list. Please try again.
          </p>
        ) : pageItems && pageItems.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {pageItems.map((item) => (
                <LibraryCard
                  key={`${item.mediaType}-${item.mediaId}`}
                  mediaType={item.mediaType}
                  mediaId={item.mediaId}
                />
              ))}
            </div>

            {onPageChange && totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => onPageChange(page - 1)}
                  disabled={page <= 1}
                  className="flex items-center gap-1 rounded-md border border-white/15 px-3 py-2 text-sm transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="size-4" />
                  Prev
                </button>
                <span className="text-sm text-white/60">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => onPageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1 rounded-md border border-white/15 px-3 py-2 text-sm transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="size-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <p className="text-white/60">{emptyMessage}</p>
            {emptyAction}
          </div>
        )}
      </div>
    </main>
  );
}
