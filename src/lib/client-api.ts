export async function api<T = { ok: boolean }>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, { ...options, headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers } });
  const body = await response.json();
  if (!response.ok) {
    const fields = body.fields ? Object.entries(body.fields as Record<string, string[]>).map(([key, values]) => `${key}: ${values.join(", ")}`).join(" · ") : "";
    throw new Error(fields ? `${body.error} ${fields}` : body.error || "Không hoàn tất được thao tác.");
  }
  return body;
}
