import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

export default function LikesPage() {
  redirect(routes.libraryTab("favorites"));
}
