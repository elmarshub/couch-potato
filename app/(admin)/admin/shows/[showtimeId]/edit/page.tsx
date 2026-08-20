"use client";

import { use } from "react";
import { ShowtimeForm } from "@/features/admin/components/showtime-form";
import { useAdminShowtimeQuery } from "@/features/admin/queries";

export default function EditShowtimePage({
  params,
}: {
  params: Promise<{ showtimeId: string }>;
}) {
  const { showtimeId } = use(params);
  const { data: showtime, isLoading, isError, refetch } = useAdminShowtimeQuery(showtimeId);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-6">Edit showtime</h2>
      {isLoading && <p className="text-gray-400">Loading...</p>}
      {isError && (
        <div className="flex items-center gap-3">
          <p className="text-gray-400">Couldn&apos;t load this showtime.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="text-sm text-red-400 hover:text-red-300 cursor-pointer underline"
          >
            Retry
          </button>
        </div>
      )}
      {showtime && <ShowtimeForm showtime={showtime} />}
    </div>
  );
}
