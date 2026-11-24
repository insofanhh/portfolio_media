import { isBlob } from "./env";

export function workerConfigured() {
  return !isBlob() || Boolean(process.env.GOOGLE_CLOUD_PROJECT && process.env.MEDIA_WORKER_JOB && process.env.GCP_SERVICE_ACCOUNT_JSON);
}
export async function dispatchWorker() {
  if (!isBlob()) return;
  if (!workerConfigured()) throw new Error("Chưa cấu hình worker xử lý media cho môi trường Blob.");
  const { GoogleAuth } = await import("google-auth-library");
  const auth = new GoogleAuth({ credentials: JSON.parse(process.env.GCP_SERVICE_ACCOUNT_JSON!), scopes: ["https://www.googleapis.com/auth/cloud-platform"] });
  const client = await auth.getClient();
  const project = encodeURIComponent(process.env.GOOGLE_CLOUD_PROJECT!);
  const region = encodeURIComponent(process.env.GOOGLE_CLOUD_REGION || "asia-southeast1");
  const job = encodeURIComponent(process.env.MEDIA_WORKER_JOB!);
  await client.request({ url: `https://run.googleapis.com/v2/projects/${project}/locations/${region}/jobs/${job}:run`, method: "POST", data: {} });
}
