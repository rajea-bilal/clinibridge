"use node";

import { S3Client } from "@aws-sdk/client-s3";

/**
 * Initialize R2 S3-compatible client
 * Call this in actions that need R2 access
 */
export function createR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!(accountId && accessKeyId && secretAccessKey)) {
    throw new Error(
      "Missing R2 credentials. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY in Convex environment."
    );
  }

  return new S3Client({
    region: "auto", // R2 uses 'auto' region
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

/**
 * Get R2 bucket name from environment
 */
export function getR2BucketName(): string {
  const bucketName = process.env.R2_BUCKET_NAME;
  if (!bucketName) {
    throw new Error("R2_BUCKET_NAME not set in Convex environment");
  }
  return bucketName;
}

/**
 * Generate a unique key for storing a file
 * @param userId - The user ID who owns the file
 * @param fileName - Original file name
 * @param prefix - Optional prefix (e.g., 'videos', 'images', 'documents')
 */
export function generateFileKey(
  userId: string,
  fileName: string,
  prefix = "files"
): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `${prefix}/${userId}/${timestamp}-${sanitizedFileName}`;
}
