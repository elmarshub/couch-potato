"use client";

import { useState } from "react";
import { Play } from "lucide-react";

interface TrailerPlayerProps {
  videoKey: string;
  title: string;
}

export function TrailerPlayer({ videoKey, title }: TrailerPlayerProps) {
  const [playing, setPlaying] = useState(false);

  if (!playing) {
    return (
      <button
        type="button"
        onClick={() => setPlaying(true)}
        aria-label={`Play trailer: ${title}`}
        className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded hover:bg-gray-700 transition cursor-pointer"
      >
        <Play className="h-4 w-4 fill-current" />
        Play Trailer
      </button>
    );
  }

  return (
    <div className="relative aspect-video w-full max-w-2xl overflow-hidden rounded-lg bg-black shadow-lg">
      <iframe
        src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0`}
        title={`${title} trailer`}
        allow="accelerate-encrypted-media; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}
