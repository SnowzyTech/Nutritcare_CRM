import { NextRequest, NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";
import { UploadApiResponse } from "cloudinary";

const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const MAX_SIZE = 20 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const uploadResults = await Promise.all(
      files.map(async (file) => {
        if (!ALLOWED_TYPES.includes(file.type)) {
          throw new Error(`Unsupported file type: ${file.name}`);
        }
        if (file.size > MAX_SIZE) {
          throw new Error(`${file.name} exceeds the 20 MB limit`);
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        return new Promise<string>((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                folder: "nutricare/expenses",
                resource_type: "auto",
                use_filename: true,
                unique_filename: true,
              },
              (error, result?: UploadApiResponse) => {
                if (error || !result) reject(error ?? new Error("Upload failed"));
                else resolve(result.secure_url);
              }
            )
            .end(buffer);
        });
      })
    );

    return NextResponse.json({ urls: uploadResults });
  } catch (err: any) {
    console.error("[upload/expense]", err);
    return NextResponse.json({ error: err.message ?? "Upload failed" }, { status: 500 });
  }
}
