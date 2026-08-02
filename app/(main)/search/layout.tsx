import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search",
  description: "Search for movies, TV shows, and people. Find your favorite entertainment content on Couch Potato.",
  keywords: ["search", "movies", "TV shows", "people", "entertainment", "discover"],
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: "Search | Couch Potato",
    description: "Search for movies, TV shows, and people. Find your favorite entertainment content.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Search | Couch Potato",
    description: "Search for movies, TV shows, and people. Find your favorite entertainment content.",
  },
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
