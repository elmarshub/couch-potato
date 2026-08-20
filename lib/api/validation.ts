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

export const seatTierSchema = z.enum(["STANDARD", "PREMIUM", "VIP"]);

export const seatPriceInputSchema = z.object({
  tier: seatTierSchema,
  priceCents: z.coerce
    .number()
    .int("Price must be a whole number of cents")
    .positive("Price must be positive"),
});

export const createShowtimeSchema = z.object({
  tmdbMovieId: mediaIdSchema,
  startsAt: z.coerce.date(),
  seatPrices: z.array(seatPriceInputSchema).min(1, "At least one seat tier price is required"),
});

export type CreateShowtimeInput = z.infer<typeof createShowtimeSchema>;

export const updateShowtimeSchema = z.object({
  startsAt: z.coerce.date().optional(),
  isCancelled: z.boolean().optional(),
  seatPrices: z.array(seatPriceInputSchema).min(1).optional(),
});

export type UpdateShowtimeInput = z.infer<typeof updateShowtimeSchema>;

export const markNotificationsReadSchema = z
  .object({
    id: z.string().uuid().optional(),
    all: z.boolean().optional(),
  })
  .refine((data) => Boolean(data.id) || data.all === true, {
    message: "Must provide id or all",
  });

export type MarkNotificationsReadInput = z.infer<typeof markNotificationsReadSchema>;

export const createBookingSchema = z.object({
  showtimeId: z.string().uuid(),
  seatIds: z.array(z.string().uuid()).min(1).max(10),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
