"use client";

import { cn } from "@/lib/utils";
import type { SeatMapSeat, SeatTier } from "../types";

const TIER_STYLES: Record<SeatTier, string> = {
  STANDARD: "bg-blue-500/90 hover:bg-blue-400 shadow-[inset_0_-3px_0_rgba(0,0,0,0.35)]",
  PREMIUM: "bg-purple-500/90 hover:bg-purple-400 shadow-[inset_0_-3px_0_rgba(0,0,0,0.35)]",
  VIP: "bg-amber-500/90 hover:bg-amber-400 shadow-[inset_0_-3px_0_rgba(0,0,0,0.35)]",
};

const TIER_LABELS: Record<SeatTier, string> = {
  STANDARD: "Standard",
  PREMIUM: "Premium",
  VIP: "VIP Recliner",
};

interface SeatMapProps {
  seats: SeatMapSeat[];
  selectedSeatIds: string[];
  onToggleSeat: (seat: SeatMapSeat) => void;
}

function splitForAisle<T>(items: T[]): [T[], T[]] {
  if (items.length <= 4) return [items, []];
  const mid = Math.ceil(items.length / 2);
  return [items.slice(0, mid), items.slice(mid)];
}

function Seat({
  seat,
  isSelected,
  onToggle,
}: {
  seat: SeatMapSeat;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const isVip = seat.tier === "VIP";
  return (
    <button
      type="button"
      disabled={seat.isTaken}
      onClick={onToggle}
      title={`${seat.row}${seat.number} · ${TIER_LABELS[seat.tier]}`}
      className={cn(
        "relative flex items-center justify-center text-[10px] font-medium transition-all rounded-t-lg rounded-b-[3px]",
        isVip ? "w-8 h-8 sm:w-9 sm:h-9" : "w-6 h-6 sm:w-7 sm:h-7",
        seat.isTaken
          ? "bg-white/10 text-gray-600 cursor-not-allowed"
          : cn(TIER_STYLES[seat.tier], "cursor-pointer text-white"),
        isSelected && "ring-2 ring-white scale-110 z-10"
      )}
    >
      {seat.number}
      <span
        className={cn(
          "absolute -top-1 left-1/2 -translate-x-1/2 h-1.5 rounded-t-full",
          isVip ? "w-5" : "w-3.5",
          seat.isTaken ? "bg-white/5" : "bg-black/20"
        )}
      />
    </button>
  );
}

export function SeatMap({ seats, selectedSeatIds, onToggleSeat }: SeatMapProps) {

  
  const bookableSeats = seats.filter((s) => s.hasPrice);
  const rows = Array.from(new Set(bookableSeats.map((s) => s.row))).sort();

  const excludedTiers = Array.from(
    new Set(seats.filter((s) => !s.hasPrice).map((s) => s.tier))
  );

  return (
    <div className="space-y-4 md:space-y-8 py-4">
      <div className="flex flex-col items-center gap-1">
        <div
          className="w-3/4 h-2 rounded-[100%] bg-gradient-to-b from-white/40 to-transparent"
          style={{ boxShadow: "0 8px 20px -4px rgba(255,255,255,0.15)" }}
        />
        <p className="text-xs text-gray-500 tracking-widest uppercase">Screen</p>
      </div>

      <div className="flex flex-col items-center gap-1.5 md:gap-2 w-fit mx-auto">
        {rows.map((row) => {
          const rowSeats = bookableSeats
            .filter((s) => s.row === row)
            .sort((a, b) => a.number - b.number);
          const [left, right] = splitForAisle(rowSeats);

          return (
            <div key={row} className="flex items-center gap-3">
              <span className="w-4 text-xs text-gray-500">{row}</span>
              <div className="flex gap-1.5">
                {left.map((seat) => (
                  <Seat
                    key={seat.id}
                    seat={seat}
                    isSelected={selectedSeatIds.includes(seat.id)}
                    onToggle={() => onToggleSeat(seat)}
                  />
                ))}
              </div>
              {right.length > 0 && (
                <>
                  <div className="w-4 sm:w-6" />
                  <div className="flex gap-1.5">
                    {right.map((seat) => (
                      <Seat
                        key={seat.id}
                        seat={seat}
                        isSelected={selectedSeatIds.includes(seat.id)}
                        onToggle={() => onToggleSeat(seat)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap justify-center gap-6 text-xs text-gray-300 pt-2">
        {(Object.keys(TIER_LABELS) as SeatTier[])
          .filter((tier) => !excludedTiers.includes(tier))
          .map((tier) => (
            <div key={tier} className="flex items-center gap-2">
              <span className={cn("w-3 h-3 rounded-t", TIER_STYLES[tier].split(" ")[0])} />
              {TIER_LABELS[tier]}
            </div>
          ))}
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-t bg-white/10" />
          Taken
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-t bg-white/90 ring-2 ring-white" />
          Selected
        </div>
      </div>

      {excludedTiers.length > 0 && (
        <p className="text-center text-xs text-gray-500">
          {excludedTiers.map((t) => TIER_LABELS[t]).join(", ")}{" "}
          {excludedTiers.length === 1 ? "isn't" : "aren't"} available for this showtime.
        </p>
      )}
    </div>
  );
}
