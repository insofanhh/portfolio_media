"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowLeft, ArrowUp, Check, Eye, Film, GripVertical, ImageIcon, LoaderCircle, Plus, Save, Send, Trash2 } from "lucide-react";
import type { AdminProject, AdminMedia } from "@/lib/admin-types";
import type { Placement, ProjectType } from "@/lib/types";
import { api } from "@/lib/client-api";
import { adminMediaView } from "@/lib/admin-media-view";
import { slugify } from "@/lib/utils";
import { MediaImage } from "../media-image";
import { UploadPanel } from "./upload-panel";
import { StatusBadge } from "./status-badge";
import { ProjectArchive } from "./project-archive";

interface Draft {
  title: string; slug: string; type: ProjectType; summary: string; concept: string; scope: string; role: string; client: string;
  year: number; credits: string; tagsText: string; featuredOrder: number; coverMediaId: string | null; seoTitle: string; seoDescription: string; isDemo: boolean;
}
export function ProjectEditor({ initial }: { initial: AdminProject | null }) {
  const router = useRouter();
  const id = initial?.id;
  const [form, setForm] = useState<Draft>({ title: initial?.title || "", slug: initial?.slug || "", type: initial?.type || "VIDEO", summary: initial?.summary || "", concept: initial?.concept || "", scope: initial?.scope || "", role: initial?.role || "", client: initial?.client || "", year: initial?.year || new Date().getFullYear(), credits: initial?.credits || "", tagsText: Array.isArray(initial?.tags) ? initial.tags.join(", ") : "", featuredOrder: initial?.featuredOrder || 0, coverMediaId: initial?.coverMediaId || null, seoTitle: initial?.seoTitle || "", seoDescription: initial?.seoDescription || "", isDemo: initial?.isDemo || false });
  const [revision, setRevision] = useState(initial?.revision || 0);
  const [rows, setRows] = useState(initial?.media || []);
  const [meta, setMeta] = useState({ status: initial?.status || "DRAFT", publicationState: initial?.publicationState || "IDLE", publicationError: initial?.publicationError || null });
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activePlacement, setActivePlacement] = useState<Placement>("MAIN");
  const [dragged, setDragged] = useState<string | null>(null);
  const [library, setLibrary] = useState<AdminMedia[] | null>(null);
  const [libraryQuery, setLibraryQuery] = useState("");
  const publishing = ["QUEUED", "PUBLISHING"].includes(meta.publicationState);
  const working = publishing || rows.some(row => ["UPLOADING", "QUEUED", "PROCESSING"].includes(row.media.status));
  const pull = useCallback(async (adoptRevision = false) => {
    if (!id) return;
    const project = await api<AdminProject>(`/api/admin/projects/${id}`);
    setMeta({ status: project.status, publicationState: project.publicationState, publicationError: project.publicationError });
    setRows(current => {
      const incoming = new Map(project.media.map(row => [row.id, row]));
      const preserved = current.filter(row => incoming.has(row.id)).map(previous => ({ ...incoming.get(previous.id)!, alt: previous.alt, caption: previous.caption, focalX: previous.focalX, focalY: previous.focalY, placement: previous.placement }));
      return [...preserved, ...project.media.filter(row => !current.some(previous => previous.id === row.id))];
    });
    if (adoptRevision) setRevision(project.revision);
  }, [id]);
  useEffect(() => {
    if (!working) return;
    const timer = setInterval(() => { void pull().catch(() => {}); }, 2200);
    return () => clearInterval(timer);
  }, [working, pull]);
  function change<K extends keyof Draft>(key: K, value: Draft[K]) { setForm(current => ({ ...current, [key]: value })); setMessage(""); }
  function editRow(linkId: string, patch: Partial<AdminProject["media"][number]>) { setRows(current => current.map(row => row.id === linkId ? { ...row, ...patch } : row)); setMessage(""); }
  function reorder(from: number, to: number) {
    if (to < 0 || to >= rows.length) return;
    setRows(current => { const next = [...current]; const [item] = next.splice(from, 1); next.splice(to, 0, item); return next; });
  }
  async function save(): Promise<boolean> {
    setPending(true); setError(""); setMessage("");
    try {
      const { tagsText, ...fields } = form;
      const body = { ...fields, tags: tagsText.split(",").map(tag => tag.trim()).filter(Boolean), revision, mediaItems: rows.map(row => ({ id: row.id, placement: row.placement, alt: row.alt, caption: row.caption, focalX: row.focalX, focalY: row.focalY })) };
      if (!id) {
        const result = await api<{ id: string }>("/api/admin/projects", { method: "POST", body: JSON.stringify(body) });
        router.replace(`/admin/projects/${result.id}`); router.refresh();
      } else {
        const result = await api<{ revision: number }>(`/api/admin/projects/${id}`, { method: "PATCH", body: JSON.stringify(body) });
        setRevision(result.revision); setMessage("Đã lưu bản nháp.");
      }
      return true;
    } catch (error) { setError(error instanceof Error ? error.message : "Chưa lưu được dự án."); return false; }
    finally { setPending(false); }
  }
  async function publish(unpublish = false) {
    if (!id || (!unpublish && !await save())) return;
    setPending(true); setError(""); setMessage("");
    try { await api(`/api/admin/projects/${id}/publish`, { method: unpublish ? "DELETE" : "POST" }); setMeta(current => ({ ...current, publicationState: "QUEUED", publicationError: null })); setMessage(unpublish ? "Đang gỡ xuất bản..." : "Đã gửi yêu cầu xuất bản. Bạn có thể theo dõi trạng thái tại đây."); }
    catch (error) { setError(error instanceof Error ? error.message : "Không xuất bản được dự án."); }
    finally { setPending(false); }
  }
  async function remove(row: AdminProject["media"][number]) {
    setError("");
    try { await api(`/api/admin/projects/${id}/media`, { method: "DELETE", body: JSON.stringify({ linkId: row.id }) }); setRows(current => current.filter(item => item.id !== row.id)); if (form.coverMediaId === row.mediaId) change("coverMediaId", null); await pull(true); }
    catch (error) { setError(error instanceof Error ? error.message : "Không gỡ được media."); }
  }
  async function retry(mediaId: string) { try { await api("/api/admin/media", { method: "POST", body: JSON.stringify({ mediaId, action: "retry" }) }); await pull(); } catch (error) { setError(error instanceof Error ? error.message : "Chưa thử lại được."); } }
  async function showLibrary() {
    try { setLibrary((await api<{ items: AdminMedia[] }>(`/api/admin/media?q=${encodeURIComponent(libraryQuery)}`)).items.filter(media => media.status === "READY")); }
    catch (error) { setError(error instanceof Error ? error.message : "Chưa mở được thư viện."); }
  }
  async function attach(mediaId: string) {
    try { await api(`/api/admin/projects/${id}/media`, { method: "POST", body: JSON.stringify({ mediaId, placement: activePlacement }) }); await pull(true); setLibrary(null); }
    catch (error) { setError(error instanceof Error ? error.message : "Không thêm được media."); }
  }
  function submit(event: FormEvent) { event.preventDefault(); void save(); }
  const cover = rows.find(row => row.mediaId === form.coverMediaId && row.media.status === "READY") || rows.find(row => row.media.status === "READY");
  return <div className="project-editor">{id && <ProjectArchive id={id} revision={revision} status={meta.status} busy={pending || publishing} />}<Link href="/admin/projects" className="text-link admin-back"><ArrowLeft size={15} />Tất cả dự án</Link><div className="admin-page-heading"><div><p className="eyebrow">PROJECT / {id ? "EDIT" : "NEW"}</p><h1>{id ? form.title || "Chỉnh sửa dự án" : "Một câu chuyện mới."}</h1></div><div className="editor-status"><StatusBadge status={publishing ? meta.publicationState : meta.status} />{id && <Link href={`/preview/${id}`} target="_blank" className="button button-light"><Eye size={15} />Xem trước</Link>}</div></div>{error && <p className="form-error" role="alert">{error}</p>}{meta.publicationError && <p className="form-error" role="alert">{meta.publicationError}</p>}{message && <p className="form-success" role="status">{message}</p>}<div className="editor-layout"><form id="project-form" className="admin-panel project-fields" onSubmit={submit}><div className="panel-title"><h2>Thông tin dự án</h2><span>Bản nháp riêng tư</span></div><fieldset disabled={pending || publishing}><label>Tên dự án<input value={form.title} required minLength={2} maxLength={150} onChange={event => { const title = event.target.value; setForm(current => ({ ...current, title, ...(!initial && (current.slug === slugify(current.title) || !current.slug) ? { slug: slugify(title) } : {}) })); }} placeholder="Tên câu chuyện bạn muốn kể" /></label><div className="form-pair"><label>Đường dẫn<input value={form.slug} required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={140} onChange={event => change("slug", event.target.value)} placeholder="ten-du-an" /></label><label>Loại dự án<select value={form.type} onChange={event => change("type", event.target.value as ProjectType)}><option value="VIDEO">Video</option><option value="PHOTO">Bộ ảnh</option><option value="MIXED">Ảnh & video</option></select></label></div><label>Mô tả ngắn<textarea value={form.summary} rows={3} maxLength={1500} onChange={event => change("summary", event.target.value)} placeholder="Giới thiệu câu chuyện trong 1–2 câu" /></label><label>Vai trò của bạn<input value={form.role} maxLength={300} onChange={event => change("role", event.target.value)} placeholder="Nhiếp ảnh · Ánh sáng · Hậu kỳ" /></label><div className="form-pair"><label>Khách hàng<input value={form.client} maxLength={150} onChange={event => change("client", event.target.value)} placeholder="Tên khách hàng / thương hiệu" /></label><label>Năm thực hiện<input type="number" value={form.year} min={1990} max={2100} onChange={event => change("year", Number(event.target.value))} /></label></div><label>Ý tưởng & cách thực hiện<textarea value={form.concept} rows={5} maxLength={10000} onChange={event => change("concept", event.target.value)} /></label><label>Phạm vi tham gia<textarea value={form.scope} rows={4} maxLength={10000} onChange={event => change("scope", event.target.value)} /></label><label>Credits<textarea value={form.credits} rows={3} maxLength={5000} onChange={event => change("credits", event.target.value)} placeholder="Ghi nhận các thành viên và đơn vị cùng tham gia" /></label><div className="form-pair"><label>Tags, ngăn cách bằng dấu phẩy<input value={form.tagsText} maxLength={480} onChange={event => change("tagsText", event.target.value)} placeholder="Product film, Beauty, Editorial" /></label><label>Thứ tự nổi bật<input type="number" min={0} max={10000} value={form.featuredOrder} onChange={event => change("featuredOrder", Number(event.target.value))} /></label></div><details className="seo-settings"><summary>Hiển thị trên tìm kiếm</summary><label>Tiêu đề SEO<input value={form.seoTitle} maxLength={150} onChange={event => change("seoTitle", event.target.value)} placeholder="Để trống để dùng tên dự án" /></label><label>Mô tả SEO<textarea value={form.seoDescription} maxLength={300} rows={3} onChange={event => change("seoDescription", event.target.value)} /></label></details><label className="checkbox-label"><input type="checkbox" checked={form.isDemo} onChange={event => change("isDemo", event.target.checked)} />Đây là nội dung minh họa</label></fieldset><button className="button button-dark" type="submit" disabled={pending || publishing}>{pending ? <LoaderCircle size={16} className="spin" /> : <Save size={16} />}{id ? "Lưu bản nháp" : "Tạo bản nháp"}</button></form><aside className="editor-side"><div className="admin-panel cover-panel"><h2>Ảnh đại diện</h2><div className={`cover-preview ${form.type === "VIDEO" ? "is-portrait" : ""}`}>{cover ? <MediaImage media={adminMediaView(cover.media)} /> : <ImageIcon size={34} strokeWidth={1} />}</div><p>Chọn “Đặt cover” ở một media bên dưới. Video sử dụng poster được tạo khi xử lý.</p></div><div className="admin-panel publish-panel"><h2>Xuất bản câu chuyện</h2><p>{meta.status === "PUBLISHED" ? "Khách đang xem bản đã xuất bản. Những chỉnh sửa mới chỉ xuất hiện sau lần xuất bản tiếp theo." : "Kiểm tra nội dung và chờ media sẵn sàng trước khi xuất bản."}</p>{id && <><button className="button button-dark" disabled={meta.status === "ARCHIVED" || pending || publishing || rows.some(row => row.media.status !== "READY") || !rows.some(row => row.placement === "MAIN")} onClick={() => void publish()}>{publishing ? <LoaderCircle size={16} className="spin" /> : <Send size={15} />}{publishing ? "Đang xử lý..." : meta.status === "PUBLISHED" ? "Xuất bản cập nhật" : "Xuất bản dự án"}</button>{meta.status === "PUBLISHED" && <button className="text-link" disabled={pending || publishing} onClick={() => void publish(true)}>Gỡ xuất bản</button>}</>}</div></aside></div>
    {id ? <section className="admin-panel project-media-panel"><div className="panel-title"><div><p className="eyebrow">THE VISUAL STORY</p><h2>Tác phẩm & hậu trường</h2></div><button type="button" className="button button-light" onClick={() => void showLibrary()}><Plus size={16} />Từ thư viện</button></div><UploadPanel projectId={id} onChange={() => { void pull(true); }} /><div className="media-placement-tabs" role="group" aria-label="Media trong dự án"><button type="button" onClick={() => setActivePlacement("MAIN")} aria-pressed={activePlacement === "MAIN"}>Tác phẩm chính <span>{rows.filter(row => row.placement === "MAIN").length}</span></button><button type="button" onClick={() => setActivePlacement("BEHIND_THE_SCENES")} aria-pressed={activePlacement === "BEHIND_THE_SCENES"}>Hậu trường <span>{rows.filter(row => row.placement === "BEHIND_THE_SCENES").length}</span></button></div><p className="help-text">Kéo thả hoặc dùng nút mũi tên để sắp xếp. Lưu bản nháp để giữ thứ tự, caption và văn bản thay thế.</p><div className="project-media-list">{rows.filter(row => row.placement === activePlacement).map(row => { const position = rows.findIndex(item => item.id === row.id); return <article key={row.id} className="editor-media-row" draggable={!publishing} onDragStart={() => setDragged(row.id)} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (dragged) reorder(rows.findIndex(item => item.id === dragged), position); setDragged(null); }}><div className="media-drag-handle"><GripVertical size={17} /><span>{String(position + 1).padStart(2, "0")}</span></div><div className="editor-media-preview">{row.media.status === "READY" ? <MediaImage media={adminMediaView(row.media)} thumbnail /> : row.media.mime.startsWith("video/") ? <Film size={25} /> : <ImageIcon size={25} />}</div><div className="editor-media-details"><div className="media-row-title"><strong>{row.media.originalName}</strong><StatusBadge status={row.media.status} /></div>{row.media.error && <p className="media-processing-error">{row.media.error}</p>}<div className="form-pair"><label>Văn bản thay thế<input value={row.alt} maxLength={500} onChange={event => editRow(row.id, { alt: event.target.value })} placeholder="Mô tả nội dung ảnh" /></label><label>Caption<input value={row.caption} maxLength={1000} onChange={event => editRow(row.id, { caption: event.target.value })} /></label></div><div className="media-meta-controls"><label>Vị trí<select value={row.placement} onChange={event => editRow(row.id, { placement: event.target.value as Placement })}><option value="MAIN">Tác phẩm chính</option><option value="BEHIND_THE_SCENES">Hậu trường</option></select></label><label>Điểm cắt ngang<input type="range" min={0} max={1} step={.05} value={row.focalX} onChange={event => editRow(row.id, { focalX: Number(event.target.value) })} /></label><label>Điểm cắt dọc<input type="range" min={0} max={1} step={.05} value={row.focalY} onChange={event => editRow(row.id, { focalY: Number(event.target.value) })} /></label></div></div><div className="editor-media-actions"><button type="button" className={`small-button ${form.coverMediaId === row.mediaId ? "is-selected" : ""}`} disabled={row.media.status !== "READY"} onClick={() => change("coverMediaId", row.mediaId)}>{form.coverMediaId === row.mediaId ? <Check size={13} /> : null}Đặt cover</button><div><button type="button" className="icon-button" aria-label={`Dịch lên ${row.media.originalName}`} onClick={() => reorder(position, position - 1)} disabled={position === 0}><ArrowUp size={15} /></button><button type="button" className="icon-button" aria-label={`Dịch xuống ${row.media.originalName}`} onClick={() => reorder(position, position + 1)} disabled={position === rows.length - 1}><ArrowDown size={15} /></button><button type="button" className="icon-button danger-text" aria-label={`Gỡ ${row.media.originalName} khỏi dự án`} onClick={() => void remove(row)}><Trash2 size={15} /></button></div>{row.media.status === "FAILED" && <button type="button" className="text-link" onClick={() => void retry(row.mediaId)}>Thử xử lý lại</button>}</div></article>; })}</div>{!rows.some(row => row.placement === activePlacement) && <div className="admin-empty"><ImageIcon size={28} strokeWidth={1} /><p>Chưa có media trong mục này.</p></div>}<button className="button button-dark" form="project-form" type="submit" disabled={pending || publishing}><Save size={15} />Lưu thay đổi</button></section> : <div className="admin-panel admin-empty"><ImageIcon size={30} /><p>Lưu bản nháp để bắt đầu thêm ảnh và video.</p></div>}
    {library !== null && <section className="admin-panel library-picker"><div className="panel-title"><h2>Chọn từ thư viện</h2><button className="text-link" onClick={() => setLibrary(null)}>Đóng</button></div><div className="library-search"><input aria-label="Tìm media theo tên" placeholder="Tìm media theo tên..." value={libraryQuery} onChange={event => setLibraryQuery(event.target.value)} /><button className="button button-light" onClick={() => void showLibrary()}>Tìm</button></div><div className="library-picker-grid">{library.map(media => <button key={media.id} onClick={() => void attach(media.id)}><MediaImage media={adminMediaView(media)} thumbnail /><span>{media.originalName}</span><Plus size={17} /></button>)}</div>{!library.length && <p className="empty-message">Không có media phù hợp đã xử lý xong.</p>}</section>}
  </div>;
}
