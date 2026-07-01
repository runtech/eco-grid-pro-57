import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ProductReviews({ productId }: { productId: string }) {
  const { locale } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("id, rating, comment, created_at, user_id")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const ids = Array.from(new Set(data.map((r) => r.user_id)));
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      return data.map((r) => ({ ...r, name: profiles?.find((p) => p.id === r.user_id)?.full_name ?? null }));
    },
  });

  const myReview = user ? reviews.find((r) => r.user_id === user.id) : null;

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("auth");
      const payload = { user_id: user.id, product_id: productId, rating, comment: comment || null };
      const { error } = await supabase.from("product_reviews").upsert(payload, { onConflict: "user_id,product_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(locale === "ar" ? "تم إرسال التقييم" : "Review submitted");
      setComment("");
      qc.invalidateQueries({ queryKey: ["reviews", productId] });
      qc.invalidateQueries({ queryKey: ["product"] });
    },
    onError: (e: Error) => toast.error(e.message === "auth" ? (locale === "ar" ? "سجل دخولك أولاً" : "Sign in first") : e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", productId] });
      qc.invalidateQueries({ queryKey: ["product"] });
    },
  });

  return (
    <div className="mt-8 rounded-xl border bg-card p-6">
      <h2 className="mb-4 text-xl font-bold">{locale === "ar" ? "التقييمات والمراجعات" : "Reviews"}</h2>

      {user ? (
        <form
          className="mb-6 rounded-lg border p-4"
          onSubmit={(e) => { e.preventDefault(); submit.mutate(); }}
        >
          <p className="mb-2 text-sm font-medium">{myReview ? (locale === "ar" ? "تعديل تقييمك" : "Update your review") : (locale === "ar" ? "اكتب تقييمك" : "Write a review")}</p>
          <div className="mb-3 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className="p-1"
                aria-label={`${n} stars`}
              >
                <Star className={`h-6 w-6 ${n <= rating ? "fill-warning text-warning" : "text-muted-foreground"}`} />
              </button>
            ))}
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={locale === "ar" ? "شاركنا تجربتك..." : "Share your experience..."}
            rows={3}
          />
          <Button type="submit" size="sm" className="mt-2" disabled={submit.isPending}>
            {locale === "ar" ? "إرسال" : "Submit"}
          </Button>
        </form>
      ) : (
        <p className="mb-4 text-sm text-muted-foreground">{locale === "ar" ? "سجل دخولك لكتابة تقييم" : "Sign in to write a review"}</p>
      )}

      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">{locale === "ar" ? "لا توجد تقييمات بعد" : "No reviews yet"}</p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="border-b pb-4 last:border-0">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={`h-4 w-4 ${n <= r.rating ? "fill-warning text-warning" : "text-muted-foreground"}`} />
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.name ?? (locale === "ar" ? "مستخدم" : "User")} · {new Date(r.created_at).toLocaleDateString(locale === "ar" ? "ar-YE" : "en-US")}
                  </p>
                </div>
                {user?.id === r.user_id && (
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => del.mutate(r.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {r.comment && <p className="mt-2 text-sm">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
