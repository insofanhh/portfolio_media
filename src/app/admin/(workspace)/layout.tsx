import { requireUser } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";
export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) { const user = await requireUser(); return <AdminShell email={user.email}>{children}</AdminShell>; }
