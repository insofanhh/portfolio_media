import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { projectInclude } from "@/lib/projects";
import { jsonSafe } from "@/lib/utils";
import { ProjectEditor } from "@/components/admin/project-editor";
import { requireUser } from "@/lib/auth";
export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const project = await db.project.findUnique({ where: { id: (await params).id }, include: projectInclude });
  if (!project) notFound();
  return <ProjectEditor key={project.id} initial={jsonSafe(project)} />;
}
