"use server";

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadProductImageAction(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "No file provided" };

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return { error: "Only JPEG, PNG, WEBP and GIF images are allowed" };
  }

  const MB = 1024 * 1024;
  if (file.size > 5 * MB) return { error: "Image must be 5 MB or smaller" };

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(dataUrl, {
      folder: "nutritcare/products",
      resource_type: "image",
      overwrite: false,
    });

    return { url: result.secure_url };
  } catch (e) {
    console.error("Cloudinary upload error:", e);
    return { error: "Upload failed — please try again" };
  }
}
