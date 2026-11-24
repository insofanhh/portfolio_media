import type { PublicMedia } from "./types";
interface MediaLike {
  id: string; mime: string; originalName: string; width: number | null; height: number | null; duration: number | null;
  variants: { id: string; kind: string; name: string; mime: string; bytes: number | bigint; width: number | null; height: number | null }[];
}
export function adminMediaView(media: MediaLike): PublicMedia {
  return { id: media.id, kind: media.mime.startsWith("video/") ? "video" : "image", name: media.originalName, alt: media.originalName, caption: "", width: media.width || 1080, height: media.height || 1920, duration: media.duration, focalX: .5, focalY: .5,
    variants: media.variants.filter(v => !["MASTER", "HLS_ASSET"].includes(v.kind)).map(v => ({ ...v, bytes: Number(v.bytes), url: `/api/media/${media.id}/${v.name}` })),
  };
}
