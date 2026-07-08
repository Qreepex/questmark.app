import { and, eq, inArray, desc, sql } from "drizzle-orm";
import { Router, type RequestHandler } from "express";
import { db } from "../db/client.js";
import { images, places, type Place } from "../db/schema.js";
import type { AuthenticatedRequest } from "../lib/request.js";
import { requireAuth } from "../middleware/require-auth.js";
import {
  deleteImageFromS3,
  extractOwnImageKey,
  resolveImageDisplayUrl,
} from "../lib/s3.js";

const placesRouter = Router();

placesRouter.use(requireAuth);

function normalizeUrlArray(value: unknown): string[] | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const rawValues = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? [value]
      : [];
  return rawValues
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0);
}

/**
 * Image entries may be a genuine external URL (pasted from elsewhere) or a
 * reference to our own private bucket. For the latter we only ever persist the
 * bare object key, and only once we've confirmed the requesting user owns it -
 * otherwise a user could type another user's key and later have it presigned.
 * A value can also be a presigned URL we previously handed out for one of the
 * user's own images (an unmodified edit round-trip), which we unwrap back to
 * its key here.
 */
async function normalizeImageUrls(
  value: unknown,
  userId: string,
): Promise<string[] | null | undefined> {
  const cleaned = normalizeUrlArray(value);

  if (cleaned === undefined || cleaned === null) {
    return cleaned;
  }

  const results: string[] = [];

  for (const entry of cleaned) {
    const ownKey = extractOwnImageKey(entry);

    if (ownKey === null) {
      results.push(entry);
      continue;
    }

    const owned = await db.query.images.findFirst({
      where: and(eq(images.key, ownKey), eq(images.userId, userId)),
    });

    if (owned) {
      results.push(ownKey);
    }
  }

  return results.length ? results : null;
}

async function resolvePlaceImages(place: Place): Promise<Place> {
  if (!place.imageUrls?.length) {
    return place;
  }

  const resolvedImageUrls = await Promise.all(
    place.imageUrls.map((entry) => resolveImageDisplayUrl(entry)),
  );

  return { ...place, imageUrls: resolvedImageUrls };
}

/**
 * Deletes any of the given user's own images (bucket object + ownership row)
 * that aren't referenced by another one of their places anymore. Called after
 * a place is removed so its uploaded images don't linger in the bucket.
 */
async function cleanUpOrphanedImages(
  userId: string,
  imageUrls: string[] | null,
): Promise<void> {
  if (!imageUrls?.length) {
    return;
  }

  const ownedImages = await db
    .select({ key: images.key })
    .from(images)
    .where(and(eq(images.userId, userId), inArray(images.key, imageUrls)));

  for (const { key } of ownedImages) {
    const stillReferenced = await db.query.places.findFirst({
      where: and(
        eq(places.userId, userId),
        sql`${places.imageUrls} @> ARRAY[${key}]::text[]`,
      ),
    });

    if (stillReferenced) {
      continue;
    }

    try {
      await deleteImageFromS3(key);
    } catch (error) {
      console.error(`Failed to delete S3 object for key ${key}:`, error);
      continue;
    }

    await db.delete(images).where(eq(images.key, key));
  }
}

const listPlaces: RequestHandler = async (request, response) => {
  const authRequest = request as AuthenticatedRequest;
  const savedPlaces = await db
    .select()
    .from(places)
    .where(eq(places.userId, authRequest.authUser.userId))
    .orderBy(desc(places.createdAt));

  response.json({ places: await Promise.all(savedPlaces.map(resolvePlaceImages)) });
};

const getPlaceById: RequestHandler = async (request, response) => {
  const authRequest = request as AuthenticatedRequest;
  const placeId = request.params.id as string;
  const place = await db.query.places.findFirst({
    where: and(
      eq(places.id, placeId),
      eq(places.userId, authRequest.authUser.userId),
    ),
  });

  if (!place) {
    response.status(404).json({ error: "Place not found" });
    return;
  }

  response.json({ place: await resolvePlaceImages(place) });
};

const createPlace: RequestHandler = async (request, response) => {
  const authRequest = request as AuthenticatedRequest;
  const {
    name,
    latitude,
    longitude,
    description,
    imageUrls,
    socialUrls,
    imageUrl,
    socialLink,
  } = request.body as {
    name?: unknown;
    latitude?: unknown;
    longitude?: unknown;
    description?: unknown;
    imageUrls?: unknown;
    socialUrls?: unknown;
    imageUrl?: unknown;
    socialLink?: unknown;
  };

  const parsedLatitude =
    typeof latitude === "string" ? Number(latitude) : latitude;
  const parsedLongitude =
    typeof longitude === "string" ? Number(longitude) : longitude;

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof parsedLatitude !== "number" ||
    Number.isNaN(parsedLatitude) ||
    typeof parsedLongitude !== "number" ||
    Number.isNaN(parsedLongitude)
  ) {
    response
      .status(400)
      .json({ error: "Name, latitude, and longitude are required" });
    return;
  }

  const [createdPlace] = await db
    .insert(places)
    .values({
      userId: authRequest.authUser.userId,
      name: name.trim(),
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      description: typeof description === "string" ? description.trim() : null,
      imageUrls:
        (await normalizeImageUrls(imageUrls ?? imageUrl, authRequest.authUser.userId)) ??
        null,
      socialUrls: normalizeUrlArray(socialUrls ?? socialLink) ?? null,
    })
    .returning();

  response.status(201).json({ place: await resolvePlaceImages(createdPlace) });
};

const updatePlace: RequestHandler = async (request, response) => {
  const authRequest = request as AuthenticatedRequest;
  const placeId = request.params.id as string;
  const {
    name,
    latitude,
    longitude,
    description,
    imageUrls,
    socialUrls,
    imageUrl,
    socialLink,
  } = request.body as {
    name?: unknown;
    latitude?: unknown;
    longitude?: unknown;
    description?: unknown;
    imageUrls?: unknown;
    socialUrls?: unknown;
    imageUrl?: unknown;
    socialLink?: unknown;
  };

  const existingPlace = await db.query.places.findFirst({
    where: and(
      eq(places.id, placeId),
      eq(places.userId, authRequest.authUser.userId),
    ),
  });

  if (!existingPlace) {
    response.status(404).json({ error: "Place not found" });
    return;
  }

  const nextImageUrls =
    imageUrls === undefined && imageUrl === undefined
      ? existingPlace.imageUrls
      : await normalizeImageUrls(imageUrls ?? imageUrl, authRequest.authUser.userId);

  const [updatedPlace] = await db
    .update(places)
    .set({
      name: typeof name === "string" ? name.trim() : existingPlace.name,
      latitude:
        typeof latitude === "string"
          ? Number(latitude)
          : typeof latitude === "number" && !Number.isNaN(latitude)
            ? latitude
            : existingPlace.latitude,
      longitude:
        typeof longitude === "string"
          ? Number(longitude)
          : typeof longitude === "number" && !Number.isNaN(longitude)
            ? longitude
            : existingPlace.longitude,
      description:
        description === undefined
          ? existingPlace.description
          : typeof description === "string"
            ? description.trim()
            : null,
      imageUrls: nextImageUrls,
      socialUrls:
        socialUrls === undefined && socialLink === undefined
          ? existingPlace.socialUrls
          : normalizeUrlArray(socialUrls ?? socialLink),
    })
    .where(eq(places.id, existingPlace.id))
    .returning();

  response.json({ place: await resolvePlaceImages(updatedPlace) });
};

const deletePlace: RequestHandler = async (request, response) => {
  const authRequest = request as AuthenticatedRequest;
  const placeId = request.params.id as string;
  const result = await db
    .delete(places)
    .where(
      and(
        eq(places.id, placeId),
        eq(places.userId, authRequest.authUser.userId),
      ),
    )
    .returning({ id: places.id, imageUrls: places.imageUrls });

  if (!result.length) {
    response.status(404).json({ error: "Place not found" });
    return;
  }

  await cleanUpOrphanedImages(authRequest.authUser.userId, result[0].imageUrls);

  response.status(204).send();
};

placesRouter.get("/", listPlaces);
placesRouter.get("/:id", getPlaceById);
placesRouter.post("/", createPlace);
placesRouter.patch("/:id", updatePlace);
placesRouter.delete("/:id", deletePlace);

export default placesRouter;
