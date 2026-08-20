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
  const { data: showtime, isLoading } = useAdminShowtimeQuery(showtimeId);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-6">Edit showtime</h2>
      {isLoading && <p className="text-gray-400">Loading...</p>}
      {showtime && <ShowtimeForm showtime={showtime} />}
    </div>
  );
}
