import "server-only";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve("./uploads");

export async function saveUploadedFile(file: File, subDir: string): Promise<{ relativePath: string; fileName: string }> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name) || "";
  const safeName = `${randomUUID()}${ext}`;
  const targetDir = path.join(UPLOAD_DIR, subDir);
  await mkdir(targetDir, { recursive: true });
  const targetPath = path.join(targetDir, safeName);
  await writeFile(targetPath, bytes);
  return { relativePath: path.join(subDir, safeName), fileName: file.name };
}

export async function savePdf(buffer: Buffer, subDir: string, fileName: string): Promise<string> {
  const targetDir = path.join(UPLOAD_DIR, subDir);
  await mkdir(targetDir, { recursive: true });
  const targetPath = path.join(targetDir, fileName);
  await writeFile(targetPath, buffer);
  return path.join(subDir, fileName);
}

export function resolveUploadPath(relativePath: string): string {
  const resolved = path.resolve(UPLOAD_DIR, relativePath);
  if (!resolved.startsWith(UPLOAD_DIR)) {
    throw new Error("Invalid file path");
  }
  return resolved;
}

export { UPLOAD_DIR };
