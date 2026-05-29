import { S3Client } from "@aws-sdk/client-s3";

const globalForS3 = globalThis as unknown as { s3: S3Client | undefined };

export const MINIO_BUCKET = process.env.MINIO_BUCKET || "uploads";
export const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || "http://localhost:9000";
export const MINIO_PUBLIC_URL = process.env.MINIO_PUBLIC_URL || MINIO_ENDPOINT;

export const s3 =
  globalForS3.s3 ??
  new S3Client({
    region: "us-east-1",
    endpoint: MINIO_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.MINIO_ACCESS_KEY || "minioadmin",
      secretAccessKey: process.env.MINIO_SECRET_KEY || "minioadmin",
    },
  });

if (process.env.NODE_ENV !== "production") globalForS3.s3 = s3;

export function publicObjectUrl(key: string): string {
  return `${MINIO_PUBLIC_URL.replace(/\/$/, "")}/${MINIO_BUCKET}/${key}`;
}
