import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

export default function WatchlistPage() {
  redirect(routes.libraryTab("watchlist"));
}
