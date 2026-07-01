import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/wishlist")({
  component: WishlistPage,
});

function WishlistPage() {
  const { t, locale } = useI18n();
  const { user, loading } = useAuth();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["wishlist", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("wishlists")
        .select("id, product:products(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-16 text-center">{t("common.loading")}</div>;
  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <Heart className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
        <h1 className="mb-4 text-2xl font-bold">{locale === "ar" ? "المفضلة" : "Wishlist"}</h1>
        <p className="mb-6 text-muted-foreground">{locale === "ar" ? "سجل دخولك لعرض المفضلة" : "Sign in to view your wishlist"}</p>
        <Link to="/auth"><Button>{t("nav.signin")}</Button></Link>
      </div>
    );
  }
  if (isLoading) return <div className="mx-auto max-w-7xl px-4 py-16 text-center">{t("common.loading")}</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 flex items-center gap-2 text-3xl font-bold">
        <Heart className="h-7 w-7 text-destructive fill-destructive" />
        {locale === "ar" ? "المفضلة" : "My Wishlist"}
      </h1>
      {items.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <p className="text-muted-foreground mb-4">{locale === "ar" ? "لا توجد منتجات في المفضلة" : "No items in your wishlist yet"}</p>
          <Link to="/products"><Button>{t("cart.empty.cta")}</Button></Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.filter((i) => i.product).map((i) => <ProductCard key={i.id} product={i.product!} />)}
        </div>
      )}
    </div>
  );
}
