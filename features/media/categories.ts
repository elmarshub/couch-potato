import {
  Calendar,
  Clapperboard,
  Compass,
  Drama,
  Film,
  Ghost,
  Heart,
  Laugh,
  Palette,
  Sparkles,
  Star,
  Trophy,
  TrendingUp,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { MovieCategory } from "./types";

export interface CategoryOption {
  id: MovieCategory;
  label: string;
  icon: LucideIcon;
}

export const CATEGORIES: CategoryOption[] = [
  { id: "trending", label: "Trending Now", icon: TrendingUp },
  { id: "popular", label: "Popular Movies", icon: Star },
  { id: "top-rated", label: "Top Rated", icon: Trophy },
  { id: "now-playing", label: "Now Playing", icon: Clapperboard },
  { id: "upcoming", label: "Coming Soon", icon: Calendar },
  { id: "hollywood", label: "Hollywood", icon: Drama },
  { id: "animation", label: "Animation", icon: Palette },
  { id: "horror", label: "Horror", icon: Ghost },
  { id: "romance", label: "Romance", icon: Heart },
  { id: "adventure", label: "Adventure", icon: Compass },
  { id: "nollywood", label: "Nollywood", icon: Film },
  { id: "anime", label: "Anime", icon: Sparkles },
  { id: "action", label: "Action", icon: Zap },
  { id: "comedy", label: "Comedy", icon: Laugh },
];
