import {
  Camera,
  Drama,
  Ghost,
  Popcorn,
  Rocket,
  Skull,
  Sparkles,
  Star,
  Swords,
  Wand2,
  type LucideIcon,
} from "lucide-react";

export interface AvatarPreset {
  id: string;
  icon: LucideIcon;
  background: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: "popcorn-red", icon: Popcorn, background: "#E50914" },
  { id: "ghost-purple", icon: Ghost, background: "#8E44AD" },
  { id: "rocket-blue", icon: Rocket, background: "#2980B9" },
  { id: "star-gold", icon: Star, background: "#D4A017" },
  { id: "drama-teal", icon: Drama, background: "#16A085" },
  { id: "skull-slate", icon: Skull, background: "#2C3E50" },
  { id: "wand-violet", icon: Wand2, background: "#7D3C98" },
  { id: "swords-orange", icon: Swords, background: "#D35400" },
  { id: "camera-green", icon: Camera, background: "#27AE60" },
  { id: "sparkles-magenta", icon: Sparkles, background: "#B81D6F" },
];

export function findAvatarPreset(id: string): AvatarPreset | undefined {
  return AVATAR_PRESETS.find((preset) => preset.id === id);
}
