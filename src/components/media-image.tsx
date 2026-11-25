/* eslint-disable @next/next/no-img-element -- Media already has responsive, pre-encoded derivatives; avoid a second lossy encode. */
import type { PublicMedia } from "@/lib/types";

export function posterVariants(media: PublicMedia) {
  return media.variants.filter(v => ["POSTER", "IMAGE", "THUMBNAIL"].includes(v.kind) && v.width).sort((a, b) => a.width! - b.width!);
}
export function posterUrl(media: PublicMedia, desiredWidth = 960) {
  const variants = posterVariants(media);
  return variants.find(v => v.width! >= desiredWidth)?.url || variants.at(-1)?.url || "";
}
export function MediaImage({ media, className = "", fit = "cover", sizes = "(max-width: 700px) 100vw, 50vw", priority = false, thumbnail = false, eager = false }: {
  media: PublicMedia; className?: string; fit?: "cover" | "contain"; sizes?: string; priority?: boolean; thumbnail?: boolean; eager?: boolean;
}) {
  const variants = posterVariants(media);
  if (!variants.length) return <div className={`media-placeholder ${className}`} role="img" aria-label={media.alt || media.name} />;
  const source = thumbnail ? variants[0] : variants.find(v => v.width! >= 960) || variants.at(-1)!;
  return <img className={className} src={source.url} srcSet={thumbnail ? undefined : variants.map(v => `${v.url} ${v.width}w`).join(", ")} sizes={thumbnail ? undefined : sizes} alt={media.alt} width={media.width} height={media.height} loading={priority || eager ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" style={{ objectFit: fit, objectPosition: `${media.focalX * 100}% ${media.focalY * 100}%` }} />;
}
