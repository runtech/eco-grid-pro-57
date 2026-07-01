import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { useI18n, formatPrice } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

function CartPage() {
  const { t, locale } = useI18n();
  const { user, loading } = useAuth();
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["cart", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("cart_items")
        .select("id, quantity, product:products(*)")
        .eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const updateQty = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      if (quantity <= 0) {
        const { error } = await supabase.from("cart_items").delete().eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cart_items").update({ quantity }).eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      qc.invalidateQueries({ queryKey: ["cart-count"] });
    },
  });


  if (loading) return <div className="mx-auto max-w-7xl px-4 py-16 text-center">{t("common.loading")}</div>;

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <ShoppingBag className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
        <h1 className="mb-4 text-2xl font-bold">{t("cart.title")}</h1>
        <p className="mb-6 text-muted-foreground">{locale === "ar" ? "سجل دخولك لعرض السلة" : "Sign in to view your cart"}</p>
        <Link to="/auth"><Button>{t("nav.signin")}</Button></Link>
      </div>
    );
  }

  if (isLoading) return <div className="mx-auto max-w-7xl px-4 py-16 text-center">{t("common.loading")}</div>;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <ShoppingBag className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
        <h1 className="mb-4 text-2xl font-bold">{t("cart.empty")}</h1>
        <Link to="/products"><Button>{t("cart.empty.cta")}</Button></Link>
      </div>
    );
  }

  const subtotal = items.reduce((s, it) => s + Number(it.product?.price ?? 0) * it.quantity, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">{t("cart.title")}</h1>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-3 md:col-span-2">
          {items.map((it) => {
            const p = it.product!;
            const name = locale === "ar" ? p.name_ar : p.name_en;
            return (
              <div key={it.id} className="flex gap-4 rounded-xl border bg-card p-4">
                <Link to="/products/$slug" params={{ slug: p.slug }} className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-accent">
                  {p.image_url ? <img src={p.image_url} alt={name} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-3xl opacity-30">☀️</div>}
                </Link>
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <Link to="/products/$slug" params={{ slug: p.slug }} className="font-semibold hover:text-primary">{name}</Link>
                    <p className="text-sm text-primary font-bold">{formatPrice(Number(p.price), locale)} {t("common.currency")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQty.mutate({ id: it.id, quantity: it.quantity - 1 })}><Minus className="h-3 w-3" /></Button>
                    <span className="w-8 text-center font-medium">{it.quantity}</span>
                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQty.mutate({ id: it.id, quantity: it.quantity + 1 })}><Plus className="h-3 w-3" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 ms-auto text-destructive" onClick={() => updateQty.mutate({ id: it.id, quantity: 0 })}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <aside className="rounded-xl border bg-card p-6 h-fit sticky top-20">
          <h2 className="mb-4 font-bold">{t("cart.title")}</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt>{t("cart.subtotal")}</dt><dd>{formatPrice(subtotal, locale)}</dd></div>
            <div className="flex justify-between text-muted-foreground"><dt>{t("cart.shipping")}</dt><dd>—</dd></div>
            <div className="mt-3 flex justify-between border-t pt-3 text-lg font-bold"><dt>{t("cart.total")}</dt><dd>{formatPrice(subtotal, locale)} {t("common.currency")}</dd></div>
          </dl>
          <Link to="/checkout" className="mt-4 block">
            <Button className="w-full gradient-primary border-0" size="lg">
              {t("cart.checkout")}
            </Button>
          </Link>
        </aside>
      </div>
    </div>
  );
}
