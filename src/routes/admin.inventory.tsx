import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Plus, Minus, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/inventory")({
  component: AdminInventory,
});

function AdminInventory() {
  const { locale } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [historyProduct, setHistoryProduct] = useState<{ id: string; name: string } | null>(null);

  const { data: products = [] } = useQuery({
    queryKey: ["admin-inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name_ar, name_en, sku, stock, low_stock_threshold, price, category")
        .order("stock", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const adjust = useMutation({
    mutationFn: async ({ id, change, reason, note }: { id: string; change: number; reason: string; note?: string }) => {
      const current = products.find((p) => p.id === id);
      if (!current) throw new Error("Product not found");
      const newStock = Math.max(0, (current.stock ?? 0) + change);
      const { error: upErr } = await supabase.from("products").update({ stock: newStock }).eq("id", id);
      if (upErr) throw upErr;
      const { error: mvErr } = await supabase.from("stock_movements").insert({
        product_id: id,
        change,
        reason,
        note: note ?? null,
        created_by: user?.id ?? null,
      });
      if (mvErr) throw mvErr;
    },
    onSuccess: () => {
      toast.success(locale === "ar" ? "تم تحديث المخزون" : "Stock updated");
      qc.invalidateQueries({ queryKey: ["admin-inventory"] });
      qc.invalidateQueries({ queryKey: ["stock-history"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const lowStock = products.filter((p) => (p.stock ?? 0) <= (p.low_stock_threshold ?? 5));
  const outOfStock = products.filter((p) => (p.stock ?? 0) === 0);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{locale === "ar" ? "إدارة المخزون" : "Inventory"}</h1>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">{locale === "ar" ? "إجمالي المنتجات" : "Total products"}</p>
          <p className="mt-1 text-2xl font-bold">{products.length}</p>
        </div>
        <div className="rounded-xl border border-warning/40 bg-warning/5 p-4">
          <p className="text-xs text-warning">{locale === "ar" ? "مخزون منخفض" : "Low stock"}</p>
          <p className="mt-1 text-2xl font-bold text-warning">{lowStock.length}</p>
        </div>
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <p className="text-xs text-destructive">{locale === "ar" ? "نفد المخزون" : "Out of stock"}</p>
          <p className="mt-1 text-2xl font-bold text-destructive">{outOfStock.length}</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="p-3 text-start">{locale === "ar" ? "المنتج" : "Product"}</th>
              <th className="p-3 text-start">SKU</th>
              <th className="p-3 text-start">{locale === "ar" ? "المخزون" : "Stock"}</th>
              <th className="p-3 text-start">{locale === "ar" ? "الحد الأدنى" : "Threshold"}</th>
              <th className="p-3 text-start">{locale === "ar" ? "الحالة" : "Status"}</th>
              <th className="p-3 text-end">{locale === "ar" ? "إجراءات" : "Actions"}</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const stock = p.stock ?? 0;
              const threshold = p.low_stock_threshold ?? 5;
              const status = stock === 0 ? "out" : stock <= threshold ? "low" : "ok";
              return (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{locale === "ar" ? p.name_ar : p.name_en}</td>
                  <td className="p-3 text-muted-foreground">{p.sku ?? "—"}</td>
                  <td className="p-3 font-bold">{stock}</td>
                  <td className="p-3 text-muted-foreground">{threshold}</td>
                  <td className="p-3">
                    {status === "out" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/20 px-2 py-0.5 text-xs text-destructive">
                        <AlertTriangle className="h-3 w-3" />{locale === "ar" ? "نفد" : "Out"}
                      </span>
                    )}
                    {status === "low" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-warning/20 px-2 py-0.5 text-xs text-warning">
                        <AlertTriangle className="h-3 w-3" />{locale === "ar" ? "منخفض" : "Low"}
                      </span>
                    )}
                    {status === "ok" && (
                      <span className="rounded-full bg-success/20 px-2 py-0.5 text-xs text-success">
                        {locale === "ar" ? "متوفر" : "OK"}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-end">
                    <div className="inline-flex gap-1">
                      <AdjustDialog
                        productName={locale === "ar" ? p.name_ar : p.name_en}
                        onSubmit={(change, reason, note) => adjust.mutate({ id: p.id, change, reason, note })}
                        locale={locale}
                      />
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setHistoryProduct({ id: p.id, name: locale === "ar" ? p.name_ar : p.name_en })}>
                        <History className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {historyProduct && (
        <HistoryDialog product={historyProduct} onClose={() => setHistoryProduct(null)} locale={locale} />
      )}
    </div>
  );
}

function AdjustDialog({ productName, onSubmit, locale }: { productName: string; onSubmit: (change: number, reason: string, note?: string) => void; locale: string }) {
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [mode, setMode] = useState<"add" | "remove">("add");
  const [reason, setReason] = useState("restock");
  const [note, setNote] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8">
          <Plus className="h-3 w-3" /><Minus className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{locale === "ar" ? "تعديل مخزون" : "Adjust stock"}: {productName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button variant={mode === "add" ? "default" : "outline"} onClick={() => setMode("add")} className="flex-1">
              <Plus className="h-4 w-4" />{locale === "ar" ? "إضافة" : "Add"}
            </Button>
            <Button variant={mode === "remove" ? "default" : "outline"} onClick={() => setMode("remove")} className="flex-1">
              <Minus className="h-4 w-4" />{locale === "ar" ? "خصم" : "Remove"}
            </Button>
          </div>
          <div>
            <Label>{locale === "ar" ? "الكمية" : "Quantity"}</Label>
            <Input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} />
          </div>
          <div>
            <Label>{locale === "ar" ? "السبب" : "Reason"}</Label>
            <select className="flex h-10 w-full rounded-md border bg-background px-3 text-sm" value={reason} onChange={(e) => setReason(e.target.value)}>
              <option value="restock">{locale === "ar" ? "استلام بضاعة" : "Restock"}</option>
              <option value="damage">{locale === "ar" ? "تلف" : "Damage"}</option>
              <option value="return">{locale === "ar" ? "مرتجع" : "Return"}</option>
              <option value="correction">{locale === "ar" ? "تصحيح جرد" : "Correction"}</option>
              <option value="other">{locale === "ar" ? "أخرى" : "Other"}</option>
            </select>
          </div>
          <div>
            <Label>{locale === "ar" ? "ملاحظة" : "Note"}</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <Button
            className="w-full"
            onClick={() => {
              onSubmit(mode === "add" ? qty : -qty, reason, note || undefined);
              setOpen(false);
              setQty(1);
              setNote("");
            }}
          >
            {locale === "ar" ? "تأكيد" : "Confirm"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function HistoryDialog({ product, onClose, locale }: { product: { id: string; name: string }; onClose: () => void; locale: string }) {
  const { data: movements = [] } = useQuery({
    queryKey: ["stock-history", product.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_movements")
        .select("*")
        .eq("product_id", product.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{locale === "ar" ? "سجل حركات" : "Movement history"}: {product.name}</DialogTitle>
        </DialogHeader>
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {movements.length === 0 && <p className="text-muted-foreground">{locale === "ar" ? "لا توجد حركات" : "No movements"}</p>}
          {movements.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <div>
                <p className="font-medium">{m.reason}{m.note && ` — ${m.note}`}</p>
                <p className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString(locale === "ar" ? "ar-YE" : "en-US")}</p>
              </div>
              <span className={`font-bold ${m.change > 0 ? "text-success" : "text-destructive"}`}>
                {m.change > 0 ? "+" : ""}{m.change}
              </span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
