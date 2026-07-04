import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Package, ShoppingBag, Users, Home, Boxes, Truck } from "lucide-react";
import { useIsAdmin } from "@/lib/use-admin";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { claimFirstAdmin } from "@/lib/admin.functions";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user, loading } = useAuth();
  const { isAdmin, isLoading } = useIsAdmin();
  const { locale } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const claim = useServerFn(claimFirstAdmin);
  const claimMut = useMutation({
    mutationFn: () => claim(),
    onSuccess: (r) => {
      if (r.ok) { toast.success(locale === "ar" ? "تمت الترقية إلى مسؤول. أعد تحميل الصفحة." : "You're now an admin. Reload the page."); setTimeout(() => window.location.reload(), 800); }
      else toast.error(locale === "ar" ? "يوجد مسؤول بالفعل" : "An admin already exists");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loading || isLoading) return <div className="mx-auto max-w-7xl px-4 py-16 text-center">Loading...</div>;
  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="mb-4 text-muted-foreground">{locale === "ar" ? "سجل دخولك أولاً" : "Sign in required"}</p>
        <Link to="/auth"><Button>{locale === "ar" ? "تسجيل الدخول" : "Sign in"}</Button></Link>
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="mb-4 text-2xl font-bold">{locale === "ar" ? "غير مصرح" : "Not authorized"}</h1>
        <p className="mb-6 text-muted-foreground">
          {locale === "ar" ? "هذه الصفحة للمسؤولين فقط. إذا كنت أول مستخدم، اضغط الزر أدناه للحصول على صلاحية المسؤول." : "Admins only. If you're the first user, claim the admin role below."}
        </p>
        <Button onClick={() => claimMut.mutate()} disabled={claimMut.isPending}>
          {locale === "ar" ? "المطالبة بصلاحية المسؤول الأول" : "Claim first admin"}
        </Button>
      </div>
    );
  }

  const links = [
    { to: "/admin", label: locale === "ar" ? "نظرة عامة" : "Overview", icon: LayoutDashboard },
    { to: "/admin/products", label: locale === "ar" ? "المنتجات" : "Products", icon: Package },
    { to: "/admin/inventory", label: locale === "ar" ? "المخزون" : "Inventory", icon: Boxes },
    { to: "/admin/orders", label: locale === "ar" ? "الطلبات" : "Orders", icon: ShoppingBag },
    { to: "/admin/logistics", label: locale === "ar" ? "الشحن" : "Logistics", icon: Truck },
    { to: "/admin/users", label: locale === "ar" ? "المستخدمون" : "Users", icon: Users },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 flex flex-wrap items-center gap-2 border-b pb-4">
        {links.map((l) => {
          const active = pathname === l.to;
          return (
            <Link key={l.to} to={l.to} className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${active ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
              <l.icon className="h-4 w-4" />{l.label}
            </Link>
          );
        })}
        <Link to="/" className="ms-auto inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted">
          <Home className="h-4 w-4" />{locale === "ar" ? "الرئيسية" : "Home"}
        </Link>
      </div>
      <Outlet />
    </div>
  );
}
