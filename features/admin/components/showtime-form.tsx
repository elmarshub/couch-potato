"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NowPlayingPicker } from "./now-playing-picker";
import {
  useCreateShowtimeMutation,
  useUpdateShowtimeMutation,
} from "../queries";
import type { SeatTier, Showtime } from "../types";
import type { Movie } from "@/features/media/types";

const TIERS: SeatTier[] = ["STANDARD", "PREMIUM", "VIP"];

function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

interface ShowtimeFormProps {
  showtime?: Showtime;
}

export function ShowtimeForm({ showtime }: ShowtimeFormProps) {
  const router = useRouter();
  const isEditing = Boolean(showtime);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const [movie, setMovie] = useState<Movie | null>(null);
  const [startsAt, setStartsAt] = useState(
    showtime ? toDatetimeLocalValue(showtime.startsAt) : ""
  );
  const [prices, setPrices] = useState<Record<SeatTier, string>>(() => {
    const initial: Record<SeatTier, string> = {
      STANDARD: "",
      PREMIUM: "",
      VIP: "",
    };
    for (const p of showtime?.seatPrices ?? []) {
      initial[p.tier] = String(p.priceCents / 100);
    }
    return initial;
  });

  const createMutation = useCreateShowtimeMutation();
  const updateMutation = useUpdateShowtimeMutation();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const hasAtLeastOnePrice = TIERS.some((tier) => {
    const value = Number(prices[tier]);
    return prices[tier].trim() !== "" && Number.isFinite(value) && value > 0;
  });
  const isFormValid =
    (isEditing || movie !== null) && startsAt.trim() !== "" && hasAtLeastOnePrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEditing && !movie) {
      toast.error("Pick a movie first");
      return;
    }
    if (!startsAt) {
      toast.error("Pick a date and time");
      return;
    }

    const seatPrices = TIERS.filter((tier) => prices[tier].trim() !== "").map(
      (tier) => ({
        tier,
        priceCents: Math.round(Number(prices[tier]) * 100),
      })
    );

    if (seatPrices.length === 0) {
      toast.error("Set a price for at least one seat tier");
      return;
    }
    if (seatPrices.some((p) => !Number.isFinite(p.priceCents) || p.priceCents <= 0)) {
      toast.error("Prices must be positive numbers");
      return;
    }

    const startsAtIso = new Date(startsAt).toISOString();

    try {
      if (isEditing && showtime) {
        await updateMutation.mutateAsync({
          id: showtime.id,
          input: { startsAt: startsAtIso, seatPrices },
        });
        toast.success("Showtime updated");
      } else if (movie) {
        await createMutation.mutateAsync({
          tmdbMovieId: movie.id,
          startsAt: startsAtIso,
          seatPrices,
        });
        toast.success("Showtime created");
      }
      router.push("/admin/shows");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
      {!isEditing && (
        <div className="space-y-2">
          <Label>Now playing</Label>
          <NowPlayingPicker value={movie} onChange={setMovie} />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="startsAt">Date & time</Label>
        <Input
          ref={dateInputRef}
          id="startsAt"
          type="datetime-local"
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
          onClick={() => dateInputRef.current?.showPicker?.()}
          onFocus={() => dateInputRef.current?.showPicker?.()}
          required
          className="[color-scheme:dark] cursor-pointer"
        />
      </div>

      <div className="space-y-3">
        <Label>Seat tier prices (USD)</Label>
        {TIERS.map((tier) => (
          <div key={tier} className="flex items-center gap-3">
            <Label htmlFor={`price-${tier}`} className="w-24 text-sm text-gray-300">
              {tier}
            </Label>
            <Input
              id={`price-${tier}`}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={prices[tier]}
              onChange={(e) =>
                setPrices((prev) => ({ ...prev, [tier]: e.target.value }))
              }
            />
          </div>
        ))}
      </div>

      <Button
        type="submit"
        disabled={isPending || !isFormValid}
        className="bg-red-600 hover:bg-red-700 text-white px-6 disabled:bg-red-600/30 cursor-pointer disabled:text-white/50"
      >
        {isPending ? "Saving..." : isEditing ? "Save changes" : "Create showtime"}
      </Button>
    </form>
  );
}
