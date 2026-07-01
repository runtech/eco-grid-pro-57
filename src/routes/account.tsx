import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { LogOut, Package } from "lucide-react";
import { useI18n, formatPrice } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/account")({
  component: AccountPage,
});

function AccountPage() {
  const { t, locale } = useI18n();
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["orders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from("orders").select("*, items:order_items(*)").eq("user_id", user.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (loading || !user) return <div className="mx-auto max-w-7xl px-4 py-16 text-center">{t("common.loading")}</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("account.title")}</h1>
          <p className="text-muted-foreground">{profile?.full_name ?? user.email}</p>
        </div>
        <Button variant="outline" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
          <LogOut className="h-4 w-4" />
          <span className="ms-1">{t("nav.signout")}</span>
        </Button>
      </div>

      <section>
        <h2 className="mb-4 text-xl font-bold">{t("account.orders")}</h2>
        {orders.length === 0 ? (
          <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
            <Package className="mx-auto mb-2 h-10 w-10 opacity-40" />
            <p>{t("account.noOrders")}</p>
            <Link to="/products"><Button variant="outline" size="sm" className="mt-4">{t("cart.empty.cta")}</Button></Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="rounded-xl border bg-card p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-mono text-sm font-bold">{o.order_number}</p>
                    <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString(locale === "ar" ? "ar-YE" : "en-US")}</p>
                  </div>
                  <Badge>{o.status}</Badge>
                </div>
                <div className="space-y-1 border-t pt-2 text-sm">
                  {o.items?.map((it) => (
                    <div key={it.id} className="flex justify-between text-muted-foreground">
                      <span>{it.product_name} × {it.quantity}</span>
                      <span>{formatPrice(Number(it.line_total), locale)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t pt-2 font-bold">
                    <span>{t("cart.total")}</span>
                    <span>{formatPrice(Number(o.total), locale)} {t("common.currency")}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
