import { randomUUID } from "node:crypto";
import { Router, type RequestHandler } from "express";
import multer from "multer";
import { db } from "../db/client.js";
import { images } from "../db/schema.js";
import { uploadImageToS3 } from "../lib/s3.js";
import type { AuthenticatedRequest } from "../lib/request.js";
import { requireAuth } from "../middleware/require-auth.js";

const uploadsRouter = Router();

uploadsRouter.use(requireAuth);

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES },
});

const ALLOWED_MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
};

const uploadImage: RequestHandler = async (request, response) => {
  const authRequest = request as AuthenticatedRequest;
  const file = request.file;

  if (!file) {
    response.status(400).json({ error: "An image file is required" });
    return;
  }

  const extension = ALLOWED_MIME_EXTENSIONS[file.mimetype];

  if (!extension) {
    response.status(400).json({ error: "Unsupported image type" });
    return;
  }

  const key = `places/${authRequest.authUser.userId}/${randomUUID()}.${extension}`;

  try {
    await uploadImageToS3(key, file.buffer, file.mimetype);
    await db.insert(images).values({ userId: authRequest.authUser.userId, key });
    response.status(201).json({ key });
  } catch (error) {
    console.error("Failed to upload image to S3:", error);
    response.status(500).json({ error: "Unable to upload image" });
  }
};

uploadsRouter.post("/image", upload.single("image"), uploadImage);

export default uploadsRouter;
