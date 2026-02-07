import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { action } from "./_generated/server";

/**
 * Public action to generate a presigned URL for file upload
 * Usage: Call this from the frontend to get a URL for uploading files directly to R2
 */
export const generateFileUploadUrl = action({
  args: {
    fileName: v.string(),
    contentType: v.string(),
    prefix: v.optional(v.string()),
  },
  returns: v.object({
    uploadUrl: v.string(),
    fileKey: v.string(),
    expiresIn: v.number(),
  }),
  handler: async (ctx, args) => {
    // Get the current user
    const user: any = await ctx.runQuery(api.auth.getCurrentUser);

    if (!user) {
      throw new Error("Not authenticated");
    }

    // Generate presigned upload URL
    const result: any = await ctx.runAction(
      internal.r2Actions.generateUploadUrl,
      {
        userId: user._id,
        fileName: args.fileName,
        contentType: args.contentType,
        prefix: args.prefix,
      }
    );

    return result;
  },
});

/**
 * Public action to generate a presigned URL for file download
 * Usage: Call this from the frontend to get a temporary URL for accessing private files
 */
export const generateFileDownloadUrl = action({
  args: {
    fileKey: v.string(),
  },
  returns: v.object({
    downloadUrl: v.string(),
    expiresIn: v.number(),
  }),
  handler: async (ctx, args) => {
    // Get the current user (optional: add permission checks here)
    const user: any = await ctx.runQuery(api.auth.getCurrentUser);

    if (!user) {
      throw new Error("Not authenticated");
    }

    // Generate presigned download URL
    const result: any = await ctx.runAction(
      internal.r2Actions.generateDownloadUrl,
      {
        fileKey: args.fileKey,
      }
    );

    return result;
  },
});

/**
 * Public action to delete a file
 * Usage: Call this when a user wants to remove their uploaded file
 */
export const deleteUserFile = action({
  args: {
    fileKey: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get the current user
    const user: any = await ctx.runQuery(api.auth.getCurrentUser);

    if (!user) {
      throw new Error("Not authenticated");
    }

    // Verify the fileKey belongs to this user (security check)
    if (!args.fileKey.includes(user._id)) {
      throw new Error("Unauthorized: You can only delete your own files");
    }

    // Delete the file
    await ctx.runAction(internal.r2Actions.deleteFile, {
      fileKey: args.fileKey,
    });

    return null;
  },
});
