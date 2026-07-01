import { Heart } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function WishlistButton({ productId, className }: { productId: string; className?: string }) {
  const { locale } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: entry } = useQuery({
    queryKey: ["wishlist-entry", user?.id, productId],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("wishlists")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const toggle = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("auth");
      if (entry) {
        const { error } = await supabase.from("wishlists").delete().eq("id", entry.id);
        if (error) throw error;
        return "removed" as const;
      }
      const { error } = await supabase.from("wishlists").insert({ user_id: user.id, product_id: productId });
      if (error) throw error;
      return "added" as const;
    },
    onSuccess: (res) => {
      toast.success(res === "added" ? (locale === "ar" ? "أضيف للمفضلة" : "Added to wishlist") : (locale === "ar" ? "أُزيل من المفضلة" : "Removed from wishlist"));
      qc.invalidateQueries({ queryKey: ["wishlist-entry", user?.id, productId] });
      qc.invalidateQueries({ queryKey: ["wishlist"] });
    },
    onError: (e: Error) => toast.error(e.message === "auth" ? (locale === "ar" ? "سجل دخولك" : "Sign in") : e.message),
  });

  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className={className}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle.mutate(); }}
      disabled={toggle.isPending}
      aria-label="wishlist"
    >
      <Heart className={`h-5 w-5 ${entry ? "fill-destructive text-destructive" : ""}`} />
    </Button>
  );
}
