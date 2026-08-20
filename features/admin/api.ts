import { http } from "@/lib/http";
import type { CreateShowtimeInput, Showtime, UpdateShowtimeInput } from "./types";

export function fetchAdminShowtime(id: string) {
  return http.get<Showtime>(`/api/admin/showtimes/${id}`);
}

export function createShowtime(input: CreateShowtimeInput) {
  return http.post<Showtime>("/api/admin/showtimes", input);
}

export function updateShowtime(id: string, input: UpdateShowtimeInput) {
  return http.patch<Showtime>(`/api/admin/showtimes/${id}`, input);
}

export function cancelShowtime(id: string) {
  return http.delete<Showtime>(`/api/admin/showtimes/${id}`);
}
