import { http } from "@/lib/http";
import type { AuthUser } from "./types";

export function fetchCurrentUser() {
  return http.get<{ user: AuthUser }>("/api/users/me").then((data) => data.user);
}

export function updateProfile(input: { name?: string; avatarPreset?: string }) {
  return http
    .patch<{ success: boolean; user: AuthUser }>("/api/profile", input)
    .then((data) => data.user);
}
