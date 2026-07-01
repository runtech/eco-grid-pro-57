import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, formatPrice } from "@/lib/i18n";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

type Status = Database["public"]["Enums"]["order_status"];
const statuses: Status[] = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

function AdminOrders() {
  const { locale } = useI18n();
  const qc = useQueryClient();

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, items:order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(locale === "ar" ? "تم التحديث" : "Updated");
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{locale === "ar" ? "إدارة الطلبات" : "Manage Orders"}</h1>
      <div className="space-y-3">
        {orders.length === 0 && <p className="text-muted-foreground">{locale === "ar" ? "لا توجد طلبات" : "No orders"}</p>}
        {orders.map((o) => {
          const addr = o.shipping_address as { full_name?: string; phone?: string; city?: string; address?: string } | null;
          return (
            <div key={o.id} className="rounded-xl border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{o.order_number}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString(locale === "ar" ? "ar-YE" : "en-US")}</p>
                  {addr?.full_name && <p className="mt-1 text-sm">{addr.full_name} · {addr.phone} · {addr.city}</p>}
                </div>
                <div className="text-end">
                  <p className="text-lg font-bold text-primary">{formatPrice(Number(o.total), locale)}</p>
                  <select
                    className="mt-1 rounded-md border bg-background px-2 py-1 text-xs"
                    value={o.status}
                    onChange={(e) => setStatus.mutate({ id: o.id, status: e.target.value as Status })}
                  >
                    {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <ul className="mt-3 space-y-1 border-t pt-3 text-sm">
                {o.items?.map((it) => (
                  <li key={it.id} className="flex justify-between text-muted-foreground">
                    <span>{it.product_name} × {it.quantity}</span>
                    <span>{formatPrice(Number(it.line_total), locale)}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
