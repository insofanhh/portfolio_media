import "dotenv/config";

const errors: string[] = [];
function check(ok: boolean, message: string) { if (!ok) errors.push(message); }
check(process.env.STORAGE_DRIVER === "blob", "Set STORAGE_DRIVER=blob.");
let database: URL | undefined;
try { database = new URL(process.env.DATABASE_URL || ""); } catch { /* Report below without exposing the URL. */ }
check(database?.protocol === "mysql:", "Set a valid MySQL DATABASE_URL.");
check(database?.searchParams.get("sslaccept") === "strict", "Require sslaccept=strict for TiDB; use the system trust store or an explicit trusted sslcert.");
check(Boolean(database?.searchParams.get("connection_limit")), "Set a small explicit connection_limit.");
try { const url = new URL(process.env.APP_URL || ""); check(url.protocol === "https:" && !["localhost", "127.0.0.1"].includes(url.hostname), "Use the final HTTPS APP_URL."); } catch { errors.push("Set APP_URL."); }
for (const name of ["WORKER_SECRET", "BLOB_READ_WRITE_TOKEN", "BLOB_PUBLIC_READ_WRITE_TOKEN", "GOOGLE_CLOUD_PROJECT", "GOOGLE_CLOUD_REGION", "MEDIA_WORKER_JOB", "GCP_SERVICE_ACCOUNT_JSON"]) check(Boolean(process.env[name]) && !process.env[name]?.includes("generate-a-"), `Set ${name}.`);
check((process.env.WORKER_SECRET || "").length >= 32, "WORKER_SECRET must contain at least 32 random characters.");
check(process.env.BLOB_READ_WRITE_TOKEN !== process.env.BLOB_PUBLIC_READ_WRITE_TOKEN, "Private/public Blob stores must use separate tokens.");
try { const account = JSON.parse(process.env.GCP_SERVICE_ACCOUNT_JSON || "{}"); check(Boolean(account.client_email && account.private_key), "Provide a valid worker-dispatch service account."); } catch { errors.push("GCP_SERVICE_ACCOUNT_JSON is not valid JSON."); }
if (errors.length) { console.error("Production configuration is incomplete:\n" + errors.map(error => `- ${error}`).join("\n")); process.exitCode = 1; }
else console.log("Configuration structure passed. Verify live TLS, migrations, Blob permissions, worker execution and media playback on staging before launch.");
