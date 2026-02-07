"use node";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { createR2Client, generateFileKey, getR2BucketName } from "./r2Client";

/**
 * Generate a presigned URL for uploading a file to R2
 * This URL allows the client to upload directly to R2 without going through Convex
 */
export const generateUploadUrl = internalAction({
  args: {
    userId: v.string(),
    fileName: v.string(),
    contentType: v.string(),
    prefix: v.optional(v.string()),
  },
  returns: v.object({
    uploadUrl: v.string(),
    fileKey: v.string(),
    expiresIn: v.number(),
  }),
  handler: async (_ctx, args) => {
    console.log("🔐 Generating presigned upload URL for R2:", {
      userId: args.userId,
      fileName: args.fileName,
      contentType: args.contentType,
      prefix: args.prefix,
    });

    try {
      const r2Client = createR2Client();
      const bucketName = getR2BucketName();
      const fileKey = generateFileKey(args.userId, args.fileName, args.prefix);

      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: fileKey,
        ContentType: args.contentType,
      });

      const expiresIn = 3600; // 1 hour
      const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn });

      console.log("✅ Generated presigned upload URL:", {
        fileKey,
        expiresIn,
      });

      return {
        uploadUrl,
        fileKey,
        expiresIn,
      };
    } catch (error) {
      console.error("❌ Error generating presigned upload URL:", error);
      throw new Error(
        `Failed to generate upload URL: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },
});

/**
 * Generate a presigned URL for downloading/viewing a file from R2
 * Use this for temporary access to private files
 */
export const generateDownloadUrl = internalAction({
  args: {
    fileKey: v.string(),
  },
  returns: v.object({
    downloadUrl: v.string(),
    expiresIn: v.number(),
  }),
  handler: async (_ctx, args) => {
    console.log("🔐 Generating presigned download URL for R2:", {
      fileKey: args.fileKey,
    });

    try {
      const r2Client = createR2Client();
      const bucketName = getR2BucketName();

      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: args.fileKey,
      });

      const expiresIn = 3600; // 1 hour
      const downloadUrl = await getSignedUrl(r2Client, command, { expiresIn });

      console.log("✅ Generated presigned download URL");

      return {
        downloadUrl,
        expiresIn,
      };
    } catch (error) {
      console.error("❌ Error generating presigned download URL:", error);
      throw new Error(
        `Failed to generate download URL: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },
});

/**
 * Delete a file from R2
 * Called from mutation when user removes a file
 */
export const deleteFile = internalAction({
  args: {
    fileKey: v.string(),
  },
  returns: v.null(),
  handler: async (_ctx, args) => {
    console.log("🗑️ Deleting file from R2:", {
      fileKey: args.fileKey,
    });

    try {
      const r2Client = createR2Client();
      const bucketName = getR2BucketName();

      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: args.fileKey,
      });

      await r2Client.send(command);

      console.log("✅ Successfully deleted file from R2:", {
        fileKey: args.fileKey,
      });

      return null;
    } catch (error) {
      console.error("❌ Error deleting file from R2:", error);
      throw new Error(
        `Failed to delete file: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },
});
