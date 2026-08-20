"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCancelShowtimeMutation } from "../queries";

export interface ShowRow {
  id: string;
  movieTitle: string;
  startsAt: string;
  totalBookings: number;
  earningsCents: number;
  isCancelled: boolean;
}

export function ShowsTable({ rows }: { rows: ShowRow[] }) {
  const router = useRouter();
  const cancelMutation = useCancelShowtimeMutation();
  const [cancelTarget, setCancelTarget] = useState<ShowRow | null>(null);

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    try {
      await cancelMutation.mutateAsync(cancelTarget.id);
      toast.success("Show cancelled");
      setCancelTarget(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to cancel");
    }
  };

  return (
    <>
      <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[560px]">
          <thead>
            <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wide">
              <th className="py-3 px-4 font-medium">Movie name</th>
              <th className="py-3 px-4 font-medium">Show time</th>
              <th className="py-3 px-4 font-medium">Total bookings</th>
              <th className="py-3 px-4 font-medium">Earnings</th>
              <th className="py-3 px-4 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => router.push(`/admin/shows/${row.id}/edit`)}
                className={cn(
                  "cursor-pointer hover:bg-white/5 transition-colors",
                  row.isCancelled && "opacity-40"
                )}
              >
                <td className="py-3 px-4">
                  {row.movieTitle}
                  {row.isCancelled && (
                    <span className="ml-2 text-xs text-red-400 align-middle">
                      Cancelled
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-gray-300 whitespace-nowrap">
                  {new Date(row.startsAt).toLocaleString()}
                </td>
                <td className="py-3 px-4 text-gray-300">{row.totalBookings}</td>
                <td className="py-3 px-4 text-gray-300">
                  ${(row.earningsCents / 100).toFixed(2)}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/shows/${row.id}/edit`}
                      onClick={(e) => e.stopPropagation()}
                      title="Edit show"
                      className="text-gray-500 hover:text-white transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                    {!row.isCancelled && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCancelTarget(row);
                        }}
                        title="Cancel show"
                        className="text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog
        open={cancelTarget !== null}
        onOpenChange={(open) => !open && setCancelTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel &ldquo;{cancelTarget?.movieTitle}&rdquo;?</DialogTitle>
            <DialogDescription>
              This showtime will be pulled from theaters. Any pending (unpaid)
              holds will be released immediately.
            </DialogDescription>
          </DialogHeader>

          {cancelTarget && cancelTarget.totalBookings > 0 && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
              <p className="text-amber-300 font-medium">
                {cancelTarget.totalBookings} paid booking
                {cancelTarget.totalBookings === 1 ? "" : "s"} · $
                {(cancelTarget.earningsCents / 100).toFixed(2)} in revenue
              </p>
              <p className="text-gray-300 mt-1">
                This revenue stays on the books and will keep showing in List
                Shows and the Dashboard &mdash; cancelling never deletes or
                zeroes out earnings already collected. Paid customers are not
                automatically refunded or notified, so follow up with them
                separately if needed.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancelTarget(null)}
              disabled={cancelMutation.isPending}
            >
              Keep show
            </Button>
            <Button
              type="button"
              onClick={handleConfirmCancel}
              disabled={cancelMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {cancelMutation.isPending ? "Cancelling..." : "Cancel show"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
