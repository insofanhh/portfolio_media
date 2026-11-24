import { ProjectEditor } from "@/components/admin/project-editor";
import { requireUser } from "@/lib/auth";
export default async function NewProjectPage() { await requireUser(); return <ProjectEditor initial={null} />; }
