import type { MediaType } from "@/features/media/types";

export interface LibraryItem {
  id: string;
  userId: string;
  mediaType: MediaType;
  mediaId: number;
  createdAt: string;
}

export interface LibraryMutationInput {
  mediaId: number;
  mediaType: MediaType;
  isActive: boolean;
}
