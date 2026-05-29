import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand, CreateBucketCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import { s3, MINIO_BUCKET, publicObjectUrl } from "@/lib/storage";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

async function ensureBucket() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: MINIO_BUCKET }));
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: MINIO_BUCKET }));
  }
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(req, "upload", 20, 3600);
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image too large (max 5MB)" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const randomId = crypto.randomUUID();
  const key = `avatars/${userId}-${randomId}.${EXT[file.type]}`;

  try {
    await ensureBucket();
    await s3.send(
      new PutObjectCommand({
        Bucket: MINIO_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );
  } catch (err) {
    logger.error("upload_failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  const url = publicObjectUrl(key);
  logger.info("upload", { userId, key, bytes: file.size });
  return NextResponse.json({ url });
}
