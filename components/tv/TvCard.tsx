import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getImageUrl } from "@/lib/format";
import { getYear } from "@/lib/format";
import { formatRating } from "@/lib/format";
import { TVShow } from "@/features/media/types";

interface TvCardProps {
  show: TVShow;
  showRanking?: boolean;
  ranking?: number;
}

export function TvCard({ show, showRanking = false, ranking }: TvCardProps) {
  return (
    <Link href={`/tvshows/${show.id}`} className="group relative">
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
        <Image
          src={getImageUrl(show.poster_path, "w500")}
          alt={show.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {showRanking && ranking && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
            #{ranking}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="text-white font-semibold text-sm line-clamp-2 mb-2">
              {show.name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-white/80 mb-2">
              <span>⭐ {formatRating(show.vote_average)}</span>
              <span>•</span>
              <span>{getYear(show.first_air_date)}</span>
            </div>
            <Button
              size="sm"
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              ▶ Watch
            </Button>
          </div>
        </div>
      </div>
      <div className="mt-2 text-sm line-clamp-1">{show.name}</div>
    </Link>
  );
}
