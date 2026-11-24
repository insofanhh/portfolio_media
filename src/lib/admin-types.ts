import type { Prisma } from "@prisma/client";
import type { ProjectRecord } from "./projects";
import type { Serialized } from "./utils";

export type AdminProject = Serialized<ProjectRecord>;
export type AdminMedia = Serialized<Prisma.MediaGetPayload<{ include: { variants: true; projects: { include: { project: { select: { id: true; title: true } } } }; _count: { select: { publicReferences: true } } } }>>;
