import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Watchlist",
  description: "Your personal watchlist of movies and TV shows you want to watch later on Couch Potato.",
  keywords: ["watchlist", "movies", "TV shows", "to watch", "personal list"],
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: "Watchlist | Couch Potato",
    description: "Your personal watchlist of movies and TV shows you want to watch later.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Watchlist | Couch Potato",
    description: "Your personal watchlist of movies and TV shows you want to watch later.",
  },
};

export default function WatchlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
