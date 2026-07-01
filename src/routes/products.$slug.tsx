import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShoppingCart, ArrowLeft, Package, Star } from "lucide-react";
import { useI18n, formatPrice } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductReviews } from "@/components/ProductReviews";
import { WishlistButton } from "@/components/WishlistButton";

export const Route = createFileRoute("/products/$slug")({
  component: ProductDetail,
});

function ProductDetail() {
  const { slug } = Route.useParams();
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  const addToCart = useMutation({
    mutationFn: async () => {
      if (!user || !product) throw new Error("auth-required");
      const { data: existing } = await supabase.from("cart_items").select("id, quantity").eq("user_id", user.id).eq("product_id", product.id).maybeSingle();
      if (existing) {
        const { error } = await supabase.from("cart_items").update({ quantity: existing.quantity + 1 }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cart_items").insert({ user_id: user.id, product_id: product.id, quantity: 1 });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(locale === "ar" ? "أُضيف إلى السلة" : "Added to cart");
      qc.invalidateQueries({ queryKey: ["cart-count"] });
    },
    onError: (e: Error) => {
      toast.error(e.message === "auth-required" ? (locale === "ar" ? "سجل دخولك أولاً" : "Sign in first") : e.message);
    },
  });

  if (isLoading) return <div className="mx-auto max-w-7xl px-4 py-16 text-center">{t("common.loading")}</div>;
  if (!product) return null;

  const name = locale === "ar" ? product.name_ar : product.name_en;
  const desc = locale === "ar" ? product.description_ar : product.description_en;
  const specs = (product.specs ?? {}) as Record<string, unknown>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link to="/products" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {t("nav.products")}
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-2xl border bg-gradient-to-br from-accent/40 to-muted">
          {product.image_url ? (
            <img src={product.image_url} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-9xl opacity-20">☀️</div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{t(`cat.${product.category}`)}</Badge>
            {product.brand && <Badge variant="outline">{product.brand}</Badge>}
            {product.stock > 0 ? (
              <Badge className="bg-success text-success-foreground">{t("products.inStock")}</Badge>
            ) : (
              <Badge variant="destructive">{t("products.outOfStock")}</Badge>
            )}
          </div>

          <h1 className="text-3xl font-bold">{name}</h1>

          {Number(product.rating) > 0 && (
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-warning text-warning" />
              <span className="font-semibold">{product.rating}</span>
              <span className="text-muted-foreground">({product.review_count})</span>
            </div>
          )}

          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-black text-primary">{formatPrice(Number(product.price), locale)}</span>
            <span className="text-lg text-muted-foreground">{t("common.currency")}</span>
            {product.compare_at_price && Number(product.compare_at_price) > Number(product.price) && (
              <span className="text-lg text-muted-foreground line-through">{formatPrice(Number(product.compare_at_price), locale)}</span>
            )}
          </div>

          {desc && <p className="text-muted-foreground leading-relaxed">{desc}</p>}

          <div className="flex gap-2">
            <Button
              size="lg"
              onClick={() => addToCart.mutate()}
              disabled={addToCart.isPending || product.stock <= 0}
              className="flex-1 gradient-primary border-0"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="ms-2">{t("products.addToCart")}</span>
            </Button>
            <WishlistButton productId={product.id} className="h-11 w-11 border" />
          </div>

          {Object.keys(specs).length > 0 && (
            <div className="mt-4 rounded-xl border bg-card p-4">
              <h2 className="mb-3 flex items-center gap-2 font-bold">
                <Package className="h-4 w-4" /> {t("products.specs")}
              </h2>
              <dl className="grid gap-2 text-sm">
                {Object.entries(specs).map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-border/50 py-1 last:border-0">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-medium">{String(Array.isArray(v) ? v.join(", ") : v)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>
      <ProductReviews productId={product.id} />
    </div>
  );
}
