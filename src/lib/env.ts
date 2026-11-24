import "dotenv/config";

export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Thiếu biến môi trường ${name}. Xem .env.example.`);
  return value;
}

export const isBlob = () => process.env.STORAGE_DRIVER === "blob";
export const appUrl = () => process.env.APP_URL || "http://127.0.0.1:3000";
export const limits = {
  image: Number(process.env.MAX_IMAGE_BYTES || 50 * 1024 ** 2),
  video: Number(process.env.MAX_VIDEO_BYTES || 2 * 1024 ** 3),
  storage: Number(process.env.MAX_STORAGE_BYTES || 20 * 1024 ** 3),
};
