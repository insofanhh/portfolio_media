"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";

export function ProjectArchive({ id, revision, status, busy }: { id: string; revision: number; status: string; busy: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  if (status === "PUBLISHED") return null;
  async function toggle() {
    setPending(true); setError("");
    try {
      await api(`/api/admin/projects/${id}/archive`, { method: "POST", body: JSON.stringify({ archived: status !== "ARCHIVED", revision }) });
      router.push("/admin/projects"); router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "Chưa cập nhật được dự án."); }
    finally { setPending(false); }
  }
  return <div className="archive-control"><button type="button" className="text-link" disabled={busy || pending} onClick={() => void toggle()}>{status === "ARCHIVED" ? "Khôi phục thành bản nháp" : "Lưu trữ dự án"}</button>{error && <p className="form-error" role="alert">{error}</p>}</div>;
}
