import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatRating, getImageUrl, getYear } from "@/lib/format";

interface BrowseCardProps {
  href: string;
  title: string;
  posterPath: string | null;
  rating: number | undefined;
  date: string | undefined;
  actionLabel: string;
  highlighted?: boolean;
}

export function BrowseCard({
  href,
  title,
  posterPath,
  rating,
  date,
  actionLabel,
  highlighted = false,
}: BrowseCardProps) {
  const year = getYear(date);

  return (
    <Link
      href={href}
      className={`group relative rounded-lg outline-none ${
        highlighted ? "ring-2 ring-red-600" : ""
      }`}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-gray-800">
        <Image
          src={getImageUrl(posterPath, "w500")}
          alt={title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
          <div className="absolute inset-x-0 bottom-0 p-3">
            <h3 className="mb-2 line-clamp-2 text-sm font-semibold text-white">
              {title}
            </h3>
            <div className="mb-2 flex items-center gap-2 text-xs text-white/80">
              {typeof rating === "number" && <span>⭐ {formatRating(rating)}</span>}
              {year && (
                <>
                  <span>•</span>
                  <span>{year}</span>
                </>
              )}
            </div>
            <span className="block w-full rounded bg-red-600 py-1.5 text-center text-sm font-medium text-white">
              {actionLabel}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-2 line-clamp-1 text-sm">{title}</div>
    </Link>
  );
}

export function BrowseGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {children}
    </div>
  );
}

export function LoadMore({
  hasNextPage,
  isFetchingNextPage,
  onClick,
}: {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onClick: () => void;
}) {
  return (
    <div className="mt-8 flex justify-center">
      <Button
        onClick={onClick}
        disabled={!hasNextPage || isFetchingNextPage}
        className="cursor-pointer bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
      >
        {isFetchingNextPage
          ? "Loading..."
          : hasNextPage
          ? "Load more"
          : "No more results"}
      </Button>
    </div>
  );
}
