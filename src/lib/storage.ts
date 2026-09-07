import "server-only";
import { put, get, del } from "@vercel/blob";
import path from "path";
import { randomUUID } from "crypto";

/**
 * All files live in Vercel Blob under `access: "private"` — the returned URL is not
 * publicly fetchable, it must be read back via `get()` (which uses BLOB_READ_WRITE_TOKEN).
 * This keeps the session-based auth checks in the API routes meaningful, and survives
 * across serverless invocations/deploys (unlike local disk, which is ephemeral on Vercel).
 */

export async function saveUploadedFile(file: File, subDir: string): Promise<{ url: string; fileName: string }> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name) || "";
  const key = `${subDir}/${randomUUID()}${ext}`;
  const blob = await put(key, bytes, { access: "private", contentType: file.type || undefined });
  return { url: blob.url, fileName: file.name };
}

export async function savePdf(buffer: Buffer, subDir: string, fileName: string): Promise<string> {
  const key = `${subDir}/${fileName}`;
  const blob = await put(key, buffer, {
    access: "private",
    contentType: "application/pdf",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return blob.url;
}

export async function readUploadedFile(url: string): Promise<Buffer> {
  const result = await get(url, { access: "private" });
  if (!result || result.statusCode !== 200) throw new Error("Blob not found");
  const arrayBuffer = await new Response(result.stream).arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function deleteUploadedFile(url: string): Promise<void> {
  await del(url);
}
