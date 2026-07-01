import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Shield, ShieldOff } from "lucide-react";
import { adminListUsers, adminSetRole } from "@/lib/admin.functions";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const { locale } = useI18n();
  const qc = useQueryClient();
  const list = useServerFn(adminListUsers);
  const setRole = useServerFn(adminSetRole);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => list(),
  });

  const toggle = useMutation({
    mutationFn: (v: { targetUserId: string; grant: boolean }) =>
      setRole({ data: { targetUserId: v.targetUserId, role: "admin", grant: v.grant } }),
    onSuccess: () => {
      toast.success(locale === "ar" ? "تم التحديث" : "Updated");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{locale === "ar" ? "إدارة المستخدمين" : "Manage Users"}</h1>
      {isLoading ? <p>Loading...</p> : (
        <div className="rounded-xl border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="p-3 text-start">{locale === "ar" ? "الاسم" : "Name"}</th>
                <th className="p-3 text-start">Email</th>
                <th className="p-3 text-start">{locale === "ar" ? "الأدوار" : "Roles"}</th>
                <th className="p-3 text-start">{locale === "ar" ? "التاريخ" : "Joined"}</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isAdmin = u.roles.includes("admin");
                return (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="p-3 font-medium">{u.profile?.full_name ?? "—"}</td>
                    <td className="p-3 text-muted-foreground">{u.email}</td>
                    <td className="p-3">
                      {u.roles.length === 0 ? <span className="text-muted-foreground">user</span> :
                        u.roles.map((r) => <span key={r} className="me-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{r}</span>)
                      }
                    </td>
                    <td className="p-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString(locale === "ar" ? "ar-YE" : "en-US")}</td>
                    <td className="p-3 text-end">
                      <Button size="sm" variant={isAdmin ? "outline" : "default"} onClick={() => toggle.mutate({ targetUserId: u.id, grant: !isAdmin })} disabled={toggle.isPending}>
                        {isAdmin ? <><ShieldOff className="h-4 w-4" /><span className="ms-1">{locale === "ar" ? "إزالة" : "Revoke"}</span></> : <><Shield className="h-4 w-4" /><span className="ms-1">{locale === "ar" ? "منح مسؤول" : "Make admin"}</span></>}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
