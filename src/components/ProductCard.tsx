import { Link } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useI18n, formatPrice } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

export function ProductCard({ product }: { product: Product }) {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();
  const name = locale === "ar" ? product.name_ar : product.name_en;

  const addToCart = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("auth-required");
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
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (e: Error) => {
      if (e.message === "auth-required") {
        toast.error(locale === "ar" ? "سجل دخولك للمتابعة" : "Please sign in");
      } else {
        toast.error(e.message);
      }
    },
  });

  const discount = product.compare_at_price && product.compare_at_price > product.price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-all hover:shadow-elegant">
      <Link
        to="/products/$slug"
        params={{ slug: product.slug }}
        className="relative block aspect-square overflow-hidden bg-gradient-to-br from-accent/40 to-muted"
      >
        {product.image_url ? (
          <img src={product.image_url} alt={name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-6xl opacity-20">☀️</div>
        )}
        {discount > 0 && (
          <Badge className="absolute end-3 top-3 bg-destructive text-destructive-foreground">-{discount}%</Badge>
        )}
        {product.is_featured && (
          <Badge className="absolute start-3 top-3 gradient-primary text-primary-foreground border-0">★</Badge>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        {product.brand && <p className="text-xs text-muted-foreground">{product.brand}</p>}
        <Link to="/products/$slug" params={{ slug: product.slug }} className="line-clamp-2 font-semibold hover:text-primary">
          {name}
        </Link>
        <div className="mt-auto flex items-baseline gap-2">
          <span className="text-lg font-bold text-primary">{formatPrice(Number(product.price), locale)}</span>
          {product.compare_at_price && Number(product.compare_at_price) > Number(product.price) && (
            <span className="text-sm text-muted-foreground line-through">{formatPrice(Number(product.compare_at_price), locale)}</span>
          )}
          <span className="text-xs text-muted-foreground">{t("common.currency")}</span>
        </div>
        <Button
          onClick={() => addToCart.mutate()}
          disabled={addToCart.isPending || product.stock <= 0}
          size="sm"
          className="w-full"
        >
          <ShoppingCart className="h-4 w-4" />
          <span className="ms-1">{product.stock > 0 ? t("products.addToCart") : t("products.outOfStock")}</span>
        </Button>
      </div>
    </div>
  );
}
