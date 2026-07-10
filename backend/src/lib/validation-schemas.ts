import { z } from "zod";

export const uuidParamSchema = z.object({ id: z.uuid() });

export const uuidAndUserIdParamSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
});

// randomBytes(24).toString("hex") in routes/lists.ts always produces 48 hex chars.
export const shareTokenParamSchema = z.object({
  token: z.string().regex(/^[0-9a-f]{48}$/, "Invalid share token"),
});

const latitude = z.coerce.number().min(-90).max(90);
const longitude = z.coerce.number().min(-180).max(180);
const trimmed = (max: number) =>
  z
    .string()
    .transform((value) => value.trim())
    .pipe(z.string().min(1).max(max));
const optionalTrimmed = (max: number) =>
  z
    .string()
    .transform((value) => value.trim())
    .pipe(z.string().max(max))
    .nullish();
const urlArray = (maxItems: number, maxLen: number) =>
  z.array(z.string().trim().min(1).max(maxLen)).max(maxItems).nullish();
const countryCode = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2}$/)
  .nullish();
const tagsArray = z.array(z.string().trim().min(1).max(50)).max(20).nullish();

export const createPlaceBodySchema = z.object({
  name: trimmed(200),
  latitude,
  longitude,
  description: optionalTrimmed(2000),
  imageUrls: urlArray(20, 2048),
  socialUrls: urlArray(20, 2048),
  imageUrl: z.string().trim().min(1).max(2048).nullish(),
  socialLink: z.string().trim().min(1).max(2048).nullish(),
  listId: z.uuid(),
  countryCode,
  tags: tagsArray,
});

export const updatePlaceBodySchema = z.object({
  name: trimmed(200).optional(),
  latitude: latitude.optional(),
  longitude: longitude.optional(),
  description: optionalTrimmed(2000),
  imageUrls: urlArray(20, 2048),
  socialUrls: urlArray(20, 2048),
  imageUrl: z.string().trim().min(1).max(2048).nullish(),
  socialLink: z.string().trim().min(1).max(2048).nullish(),
  listId: z.uuid().optional(),
  countryCode,
  tags: tagsArray,
});

export const createVisitBodySchema = z.object({
  placeId: z.uuid(),
  visitedAt: z.iso.date(),
  notes: optionalTrimmed(2000),
});

export const updateVisitBodySchema = z.object({
  visitedAt: z.iso.date().optional(),
  notes: optionalTrimmed(2000),
});

export const listNameBodySchema = z.object({
  name: trimmed(100),
});

export const shareRoleBodySchema = z.object({
  role: z.enum(["view", "add", "edit"]),
});

export const geocodeSearchQuerySchema = z.object({
  q: trimmed(200),
});

export const geocodeReverseQuerySchema = z.object({
  lat: latitude,
  lon: longitude,
});

export const oauthCallbackQuerySchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});
