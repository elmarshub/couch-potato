import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Library",
  description: "Your favorites and watchlist, all in one place on Couch Potato.",
  keywords: ["library", "favorites", "watchlist", "movies", "TV shows", "personal list"],
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: "My Library | Couch Potato",
    description: "Your favorites and watchlist, all in one place.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "My Library | Couch Potato",
    description: "Your favorites and watchlist, all in one place.",
  },
};

export default function LibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
