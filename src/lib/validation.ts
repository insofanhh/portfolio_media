import { z } from "zod";

export const projectSchema = z.object({
  title: z.string().trim().min(2).max(150),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(2).max(140),
  type: z.enum(["PHOTO", "VIDEO", "MIXED"]),
  summary: z.string().trim().max(1500),
  concept: z.string().trim().max(10000),
  scope: z.string().trim().max(10000),
  role: z.string().trim().max(300),
  client: z.string().trim().max(150),
  year: z.coerce.number().int().min(1990).max(2100),
  credits: z.string().max(5000),
  tags: z.array(z.string().trim().max(40)).max(12),
  featuredOrder: z.coerce.number().int().min(0).max(10000),
  coverMediaId: z.string().max(40).nullable(),
  seoTitle: z.string().max(150),
  seoDescription: z.string().max(300),
  isDemo: z.boolean().default(false),
});
export const settingsSchema = z.object({
  name: z.string().trim().min(2).max(80), brand: z.string().trim().min(2).max(40),
  profession: z.string().trim().min(2).max(100), bio: z.string().max(1000), about: z.string().max(5000),
  email: z.union([z.email(), z.literal("")]), phone: z.string().max(40), location: z.string().max(100),
  instagram: z.union([z.url().regex(/^https:\/\//), z.literal("")]),
  tiktok: z.union([z.url().regex(/^https:\/\//), z.literal("")]),
  youtube: z.union([z.url().regex(/^https:\/\//), z.literal("")]), heroProjectId: z.string().max(40),
});
export const inquirySchema = z.object({
  name: z.string().trim().min(2).max(100), email: z.email().max(200),
  projectType: z.enum(["PHOTO", "VIDEO", "MIXED", "OTHER"]),
  brief: z.string().trim().min(15).max(5000), website: z.string().max(200).optional(),
});
export const mediaEditSchema = z.object({
  alt: z.string().max(500), caption: z.string().max(1000),
  focalX: z.coerce.number().min(0).max(1), focalY: z.coerce.number().min(0).max(1),
});
