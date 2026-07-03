import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import { ShoppingBag, CheckCircle2 } from "lucide-react";
import { useI18n, formatPrice } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

function CheckoutPage() {
  const { t, locale } = useI18n();
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "jaib" | "onecash">("cod");

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

  const placeOrder = useMutation({
    mutationFn: async () => {
      if (!user || items.length === 0) throw new Error("empty");
      if (!fullName || !phone || !city || !address) throw new Error("missing_fields");
      const subtotal = items.reduce((s, it) => s + Number(it.product?.price ?? 0) * it.quantity, 0);
      const shipping = subtotal >= 100000 ? 0 : 5000;
      const total = subtotal + shipping;
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          subtotal,
          shipping_fee: shipping,
          total,
          shipping_address: { full_name: fullName, phone, city, address },
          notes: notes || null,
          payment_method: paymentMethod,
          payment_status: "pending",
        })
        .select()
        .single();
      if (error) throw error;
      const orderItems = items.map((it) => ({
        order_id: order.id,
        product_id: it.product!.id,
        product_name: locale === "ar" ? it.product!.name_ar : it.product!.name_en,
        unit_price: Number(it.product!.price),
        quantity: it.quantity,
        line_total: Number(it.product!.price) * it.quantity,
      }));
      const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
      if (itemsErr) throw itemsErr;
      await supabase.from("cart_items").delete().eq("user_id", user.id);
      return order;
    },
    onSuccess: (order) => {
      toast.success(locale === "ar" ? `تم إنشاء الطلب ${order.order_number}` : `Order ${order.order_number} placed`);
      qc.invalidateQueries({ queryKey: ["cart"] });
      qc.invalidateQueries({ queryKey: ["cart-count"] });
      navigate({ to: "/account" });
    },
    onError: (e: Error) => {
      if (e.message === "missing_fields") toast.error(locale === "ar" ? "أكمل جميع الحقول المطلوبة" : "Fill all required fields");
      else if (e.message === "empty") toast.error(locale === "ar" ? "السلة فارغة" : "Cart is empty");
      else toast.error(e.message);
    },
  });

  if (loading || isLoading) return <div className="mx-auto max-w-7xl px-4 py-16 text-center">{t("common.loading")}</div>;
  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="mb-4 text-2xl font-bold">{t("cart.checkout")}</h1>
        <Link to="/auth"><Button>{t("nav.signin")}</Button></Link>
      </div>
    );
  }
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
  const shipping = subtotal >= 100000 ? 0 : 5000;
  const total = subtotal + shipping;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">{t("cart.checkout")}</h1>
      <div className="grid gap-6 md:grid-cols-3">
        <form
          className="space-y-4 md:col-span-2 rounded-xl border bg-card p-6"
          onSubmit={(e) => { e.preventDefault(); placeOrder.mutate(); }}
        >
          <h2 className="font-bold text-lg">{locale === "ar" ? "عنوان الشحن" : "Shipping address"}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="fn">{locale === "ar" ? "الاسم الكامل" : "Full name"} *</Label>
              <Input id="fn" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="ph">{locale === "ar" ? "رقم الهاتف" : "Phone"} *</Label>
              <Input id="ph" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="ct">{locale === "ar" ? "المدينة" : "City"} *</Label>
              <Input id="ct" value={city} onChange={(e) => setCity(e.target.value)} required />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="ad">{locale === "ar" ? "العنوان التفصيلي" : "Address details"} *</Label>
              <Input id="ad" value={address} onChange={(e) => setAddress(e.target.value)} required />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="nt">{locale === "ar" ? "ملاحظات (اختياري)" : "Notes (optional)"}</Label>
              <Textarea id="nt" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
          </div>
          <div className="pt-2">
            <h2 className="font-bold text-lg mb-3">{locale === "ar" ? "طريقة الدفع" : "Payment method"}</h2>
            <div className="grid gap-2 sm:grid-cols-3">
              {([
                { id: "cod", ar: "الدفع عند الاستلام", en: "Cash on delivery" },
                { id: "jaib", ar: "محفظة جيب", en: "Jaib wallet" },
                { id: "onecash", ar: "وان كاش", en: "OneCash" },
              ] as const).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id)}
                  className={`rounded-lg border p-3 text-sm font-medium transition ${
                    paymentMethod === m.id ? "border-primary bg-primary/5 ring-2 ring-primary" : "hover:bg-muted"
                  }`}
                >
                  {locale === "ar" ? m.ar : m.en}
                </button>
              ))}
            </div>
            {paymentMethod !== "cod" && (
              <p className="mt-2 text-xs text-muted-foreground">
                {locale === "ar"
                  ? "سيتم التواصل معك لإتمام الدفع بعد تأكيد الطلب."
                  : "You will be contacted to complete payment after order confirmation."}
              </p>
            )}
          </div>
          <Button type="submit" size="lg" className="w-full gradient-primary border-0" disabled={placeOrder.isPending}>
            <CheckCircle2 className="h-5 w-5" />
            <span className="ms-2">{locale === "ar" ? "تأكيد الطلب" : "Confirm order"}</span>
          </Button>
        </form>
        <aside className="rounded-xl border bg-card p-6 h-fit sticky top-20">
          <h2 className="mb-4 font-bold">{locale === "ar" ? "ملخص الطلب" : "Order summary"}</h2>
          <ul className="space-y-2 text-sm mb-4 max-h-60 overflow-auto">
            {items.map((it) => (
              <li key={it.id} className="flex justify-between gap-2">
                <span className="truncate">{(locale === "ar" ? it.product?.name_ar : it.product?.name_en)} × {it.quantity}</span>
                <span className="font-medium shrink-0">{formatPrice(Number(it.product?.price ?? 0) * it.quantity, locale)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 text-sm border-t pt-3">
            <div className="flex justify-between"><dt>{t("cart.subtotal")}</dt><dd>{formatPrice(subtotal, locale)}</dd></div>
            <div className="flex justify-between"><dt>{t("cart.shipping")}</dt><dd>{shipping === 0 ? (locale === "ar" ? "مجاني" : "Free") : formatPrice(shipping, locale)}</dd></div>
            <div className="mt-3 flex justify-between border-t pt-3 text-lg font-bold"><dt>{t("cart.total")}</dt><dd>{formatPrice(total, locale)} {t("common.currency")}</dd></div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
