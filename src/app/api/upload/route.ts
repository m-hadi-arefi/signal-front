import { NextRequest, NextResponse } from "next/server";
import {
  PutObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
} from "@aws-sdk/client-s3";
import { s3, MINIO_BUCKET, publicObjectUrl } from "@/lib/storage";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { getServerT } from "@/lib/i18n-server";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png":  "png",
  "image/webp": "webp",
  "image/gif":  "gif",
};

/** Public-read bucket policy so uploaded avatars are accessible via direct URL. */
const publicReadPolicy = JSON.stringify({
  Version: "2012-10-17",
  Statement: [
    {
      Effect: "Allow",
      Principal: { AWS: ["*"] },
      Action: ["s3:GetObject"],
      Resource: [`arn:aws:s3:::${MINIO_BUCKET}/*`],
    },
  ],
});

async function ensureBucket() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: MINIO_BUCKET }));
  } catch {
    // Bucket doesn't exist — create it and set public read so images are accessible
    await s3.send(new CreateBucketCommand({ Bucket: MINIO_BUCKET }));
    try {
      await s3.send(
        new PutBucketPolicyCommand({ Bucket: MINIO_BUCKET, Policy: publicReadPolicy })
      );
    } catch (policyErr) {
      logger.warn("upload_bucket_policy_failed", {
        error: policyErr instanceof Error ? policyErr.message : String(policyErr),
      });
    }
  }
}

export async function POST(req: NextRequest) {
  const t = getServerT(req);
  const userId = req.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

  const rl = await rateLimit(req, "upload", 20, 3600);
  if (!rl.success) return NextResponse.json({ error: t("too_many_requests") }, { status: 429 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: t("no_file_provided") }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: t("unsupported_image_type") }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: t("image_too_large") }, { status: 400 });
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
    logger.error("upload_failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: t("upload_failed") }, { status: 500 });
  }

  const url = publicObjectUrl(key);
  logger.info("upload_success", { userId, key, bytes: file.size });
  return NextResponse.json({ url });
}
