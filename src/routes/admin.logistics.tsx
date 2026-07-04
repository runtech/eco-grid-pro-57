import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Truck, PackageCheck, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, formatPrice } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin/logistics")({
  component: AdminLogistics,
});

type Status = Database["public"]["Enums"]["order_status"];

function AdminLogistics() {
  const { locale } = useI18n();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Status | "all">("confirmed");
  const [drafts, setDrafts] = useState<Record<string, { tracking_number?: string; carrier?: string }>>({});

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-logistics", filter],
    queryFn: async () => {
      let q = supabase
        .from("orders")
        .select("id, order_number, status, total, tracking_number, carrier, shipped_at, delivered_at, shipping_address, created_at")
        .order("created_at", { ascending: false });
      if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<{ tracking_number: string; carrier: string; status: Status }> }) => {
      const { error } = await supabase.from("orders").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(locale === "ar" ? "تم التحديث" : "Updated");
      qc.invalidateQueries({ queryKey: ["admin-logistics"] });
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filters: (Status | "all")[] = ["all", "confirmed", "shipped", "delivered"];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold flex items-center gap-2">
        <Truck className="h-6 w-6" />
        {locale === "ar" ? "الشحن واللوجستيات" : "Logistics & Shipping"}
      </h1>

      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
            {f === "all" ? (locale === "ar" ? "الكل" : "All") : f}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {orders.length === 0 && <p className="text-muted-foreground">{locale === "ar" ? "لا توجد طلبات" : "No orders"}</p>}
        {orders.map((o) => {
          const addr = o.shipping_address as { full_name?: string; phone?: string; city?: string; address?: string } | null;
          const draft = drafts[o.id] ?? {};
          const tracking = draft.tracking_number ?? o.tracking_number ?? "";
          const carrier = draft.carrier ?? o.carrier ?? "";
          return (
            <div key={o.id} className="rounded-xl border bg-card p-4">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{o.order_number}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString(locale === "ar" ? "ar-YE" : "en-US")}</p>
                  {addr?.full_name && <p className="mt-1 text-sm">{addr.full_name} · {addr.phone} · {addr.city}</p>}
                  {addr?.address && <p className="text-xs text-muted-foreground">{addr.address}</p>}
                </div>
                <div className="text-end">
                  <p className="text-lg font-bold text-primary">{formatPrice(Number(o.total), locale)}</p>
                  <p className="mt-1 text-xs uppercase text-muted-foreground">{o.status}</p>
                </div>
              </div>

              <div className="grid gap-3 border-t pt-3 sm:grid-cols-2">
                <div>
                  <Label>{locale === "ar" ? "شركة الشحن" : "Carrier"}</Label>
                  <Input
                    value={carrier}
                    onChange={(e) => setDrafts({ ...drafts, [o.id]: { ...draft, carrier: e.target.value } })}
                    placeholder={locale === "ar" ? "مثال: بريد اليمن" : "e.g. DHL"}
                  />
                </div>
                <div>
                  <Label>{locale === "ar" ? "رقم التتبع" : "Tracking number"}</Label>
                  <Input
                    value={tracking}
                    onChange={(e) => setDrafts({ ...drafts, [o.id]: { ...draft, tracking_number: e.target.value } })}
                  />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => save.mutate({ id: o.id, patch: { tracking_number: tracking || null as any, carrier: carrier || null as any } })}
                  disabled={save.isPending}
                >
                  <Save className="h-3 w-3" />
                  <span className="ms-1">{locale === "ar" ? "حفظ" : "Save"}</span>
                </Button>
                {o.status === "confirmed" && (
                  <Button size="sm" variant="secondary" onClick={() => save.mutate({ id: o.id, patch: { status: "shipped", tracking_number: tracking || null as any, carrier: carrier || null as any } })}>
                    <Truck className="h-3 w-3" />
                    <span className="ms-1">{locale === "ar" ? "شحن" : "Mark shipped"}</span>
                  </Button>
                )}
                {o.status === "shipped" && (
                  <Button size="sm" variant="secondary" onClick={() => save.mutate({ id: o.id, patch: { status: "delivered" } })}>
                    <PackageCheck className="h-3 w-3" />
                    <span className="ms-1">{locale === "ar" ? "تم التسليم" : "Mark delivered"}</span>
                  </Button>
                )}
                {o.shipped_at && (
                  <span className="text-xs text-muted-foreground">
                    {locale === "ar" ? "شُحن" : "Shipped"}: {new Date(o.shipped_at).toLocaleDateString()}
                  </span>
                )}
                {o.delivered_at && (
                  <span className="text-xs text-success">
                    {locale === "ar" ? "سُلم" : "Delivered"}: {new Date(o.delivered_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
