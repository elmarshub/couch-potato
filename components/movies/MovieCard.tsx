import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getImageUrl } from "@/lib/format";
import { getYear } from "@/lib/format";
import { formatRating } from "@/lib/format";
import { Movie } from "@/features/media/types";
import { motion } from "framer-motion";

interface MovieCardProps {
  movie: Movie;
  showRanking?: boolean;
  ranking?: number;
}

export function MovieCard({
  movie,
  showRanking = false,
  ranking,
}: MovieCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className="group relative"
    >
      <Link href={`/movies/${movie.id}?type=movie`}>
        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
          <Image
            src={getImageUrl(movie.poster_path, "w500")}
            alt={movie.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
          />

          {showRanking && ranking && (
            <motion.div
              className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-red-600 text-white text-xs font-bold px-1 sm:px-2 py-1 rounded"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              #{ranking}
            </motion.div>
          )}

          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
          >
            <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
              <h3 className="text-white font-semibold text-xs sm:text-sm line-clamp-2 mb-1 sm:mb-2">
                {movie.title}
              </h3>
              <div className="flex items-center gap-1 sm:gap-2 text-xs text-white/80 mb-1 sm:mb-2">
                <span>⭐ {formatRating(movie.vote_average)}</span>
                <span>•</span>
                <span>{getYear(movie.release_date)}</span>
              </div>
              <Button
                size="sm"
                className="w-full bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm py-1 sm:py-2"
              >
                ▶ Play
              </Button>
            </div>
          </motion.div>
        </div>
        <div className="mt-2 text-xs sm:text-sm line-clamp-1 text-white/90">
          {movie.title}
        </div>
      </Link>
    </motion.div>
  );
}
