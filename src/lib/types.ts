export type ProjectType = "PHOTO" | "VIDEO" | "MIXED";
export type Placement = "MAIN" | "BEHIND_THE_SCENES";

export interface PublicVariant {
  id: string;
  kind: string;
  name: string;
  url: string;
  width: number | null;
  height: number | null;
  bytes: number;
  mime: string;
}
export interface PublicMedia {
  id: string;
  kind: "image" | "video";
  name: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
  duration: number | null;
  focalX: number;
  focalY: number;
  variants: PublicVariant[];
}
export interface PublicProject {
  id: string;
  slug: string;
  title: string;
  type: ProjectType;
  summary: string;
  concept: string;
  scope: string;
  role: string;
  client: string;
  year: number;
  credits: string;
  tags: string[];
  featuredOrder: number;
  isDemo: boolean;
  seoTitle: string;
  seoDescription: string;
  publishedAt: string;
  cover: PublicMedia;
  main: PublicMedia[];
  backstage: PublicMedia[];
}
export interface Settings {
  name: string;
  brand: string;
  profession: string;
  bio: string;
  about: string;
  email: string;
  phone: string;
  location: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  heroProjectId: string;
}
export const defaultSettings: Settings = {
  name: "Tên của bạn",
  brand: "FRAME",
  profession: "Photographer & Filmmaker",
  bio: "Tôi tạo nên những hình ảnh và thước phim giàu cảm xúc, giúp thương hiệu kể câu chuyện của riêng mình.",
  about: "Tôi đồng hành từ concept, sản xuất đến hậu kỳ, với sự chỉn chu trong từng chi tiết và một góc nhìn nhất quán cho thương hiệu.",
  email: "",
  phone: "",
  location: "Việt Nam",
  instagram: "",
  tiktok: "",
  youtube: "",
  heroProjectId: "",
};
