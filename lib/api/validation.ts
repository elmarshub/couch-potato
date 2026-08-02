import { z } from "zod";

export const mediaTypeSchema = z.enum(["movie", "tv"]);

export const mediaIdSchema = z.coerce
  .number()
  .int("mediaId must be an integer")
  .positive("mediaId must be positive")
  .max(2_147_483_647, "mediaId out of range");

export const mediaItemSchema = z.object({
  mediaType: mediaTypeSchema,
  mediaId: mediaIdSchema,
});

export type MediaItemInput = z.infer<typeof mediaItemSchema>;

export const profileUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name cannot be empty")
    .max(80, "Name must be 80 characters or fewer")
    .regex(
      /^[\p{L}\p{M}'’.\- ]+$/u,
      "Name may only contain letters, spaces, apostrophes, periods and hyphens",
    )
    .optional(),

  avatarPreset: z.string().min(1).max(64).optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export function formatZodError(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join("; ");
}
