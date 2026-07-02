import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";

const CATEGORIES = ["solar_panels", "batteries", "inverters", "charge_controllers", "appliances", "complete_systems", "accessories"] as const;

const searchSchema = z.object({
  category: z.enum(CATEGORIES).optional(),
});

export const Route = createFileRoute("/products")({
  validateSearch: searchSchema,
  component: ProductsPage,
  head: () => ({
    meta: [
      { title: "المنتجات — SolarHub | ألواح، بطاريات، إنفرترات" },
      { name: "description", content: "تصفح ألواح الطاقة الشمسية، البطاريات، الإنفرترات، منظمات الشحن، والمنظومات الكاملة بأفضل الأسعار." },
      { property: "og:title", content: "Solar Products — SolarHub" },
      { property: "og:description", content: "Solar panels, batteries, inverters, controllers, and complete systems." },
      { property: "og:url", content: "/products" },
    ],
    links: [{ rel: "canonical", href: "/products" }],
  }),
});

function ProductsPage() {
  const { t } = useI18n();
  const { category } = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", category ?? "all"],
    queryFn: async () => {
      let q = supabase.from("products").select("*").eq("is_active", true).order("created_at", { ascending: false });
      if (category) q = q.eq("category", category);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">{t("products.title")}</h1>
      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={!category ? "default" : "outline"}
          onClick={() => navigate({ search: {} })}
        >
          {t("products.filter.all")}
        </Button>
        {CATEGORIES.map((c) => (
          <Button
            key={c}
            size="sm"
            variant={category === c ? "default" : "outline"}
            onClick={() => navigate({ search: { category: c } })}
          >
            {t(`cat.${c}`)}
          </Button>
        ))}
      </div>
      {isLoading ? (
        <p className="text-center text-muted-foreground">{t("common.loading")}</p>
      ) : products.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">{t("products.empty")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
