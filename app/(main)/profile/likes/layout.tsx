import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Favorites",
  description: "Your favorite movies and TV shows on Couch Potato. Keep track of the content you love most.",
  keywords: ["favorites", "likes", "movies", "TV shows", "personal list", "favorite content"],
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: "Favorites | Couch Potato",
    description: "Your favorite movies and TV shows. Keep track of the content you love most.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Favorites | Couch Potato",
    description: "Your favorite movies and TV shows. Keep track of the content you love most.",
  },
};

export default function FavoritesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
