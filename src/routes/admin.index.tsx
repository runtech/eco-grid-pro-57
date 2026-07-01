import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Package, ShoppingBag, DollarSign, Star } from "lucide-react";
import { useI18n, formatPrice } from "@/lib/i18n";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const { locale } = useI18n();
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [products, orders, reviews] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("total, status", { count: "exact" }),
        supabase.from("product_reviews").select("*", { count: "exact", head: true }),
      ]);
      const revenue = (orders.data ?? []).reduce((s, o) => s + Number(o.total ?? 0), 0);
      return {
        productCount: products.count ?? 0,
        orderCount: orders.count ?? 0,
        reviewCount: reviews.count ?? 0,
        revenue,
      };
    },
  });

  const cards = [
    { label: locale === "ar" ? "المنتجات" : "Products", value: stats?.productCount ?? 0, icon: Package },
    { label: locale === "ar" ? "الطلبات" : "Orders", value: stats?.orderCount ?? 0, icon: ShoppingBag },
    { label: locale === "ar" ? "الإيرادات" : "Revenue", value: formatPrice(stats?.revenue ?? 0, locale), icon: DollarSign },
    { label: locale === "ar" ? "المراجعات" : "Reviews", value: stats?.reviewCount ?? 0, icon: Star },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{locale === "ar" ? "لوحة التحكم" : "Dashboard"}</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border bg-card p-6">
            <c.icon className="mb-3 h-6 w-6 text-primary" />
            <p className="text-sm text-muted-foreground">{c.label}</p>
            <p className="mt-1 text-2xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
