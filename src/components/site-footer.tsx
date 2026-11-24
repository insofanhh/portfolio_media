import Link from "next/link";
import type { Settings } from "@/lib/types";

export function SiteFooter({ settings }: { settings: Settings }) {
  return <footer className="site-footer"><span>© {new Date().getFullYear()} {settings.brand} · Photo & Film</span><div>{settings.instagram && <a href={settings.instagram} target="_blank" rel="noreferrer">Instagram ↗</a>}{settings.tiktok && <a href={settings.tiktok} target="_blank" rel="noreferrer">TikTok ↗</a>}{settings.youtube && <a href={settings.youtube} target="_blank" rel="noreferrer">YouTube ↗</a>}<Link href="/privacy">Quyền riêng tư</Link></div></footer>;
}
