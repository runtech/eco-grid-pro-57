import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, formatPrice } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin/products")({
  component: AdminProducts,
});

type P = Tables<"products">;

const categories: P["category"][] = ["solar_panels", "batteries", "inverters", "charge_controllers", "appliances", "accessories", "complete_systems"];

function AdminProducts() {
  const { locale } = useI18n();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<P> | null>(null);

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async (p: Partial<P>) => {
      const payload = {
        slug: p.slug!,
        name_ar: p.name_ar!,
        name_en: p.name_en!,
        description_ar: p.description_ar ?? null,
        description_en: p.description_en ?? null,
        category: p.category!,
        brand: p.brand ?? null,
        price: Number(p.price),
        compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
        stock: Number(p.stock ?? 0),
        image_url: p.image_url ?? null,
        is_featured: !!p.is_featured,
        is_active: p.is_active ?? true,
      };
      if (p.id) {
        const { error } = await supabase.from("products").update(payload).eq("id", p.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(locale === "ar" ? "تم الحفظ" : "Saved");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(locale === "ar" ? "تم الحذف" : "Deleted");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{locale === "ar" ? "إدارة المنتجات" : "Manage Products"}</h1>
        <Button onClick={() => setEditing({ is_active: true, stock: 0, price: 0, category: "solar_panels" })}>
          <Plus className="h-4 w-4" /><span className="ms-1">{locale === "ar" ? "منتج جديد" : "New product"}</span>
        </Button>
      </div>

      {editing && (
        <div className="mb-6 rounded-xl border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">{editing.id ? (locale === "ar" ? "تعديل منتج" : "Edit product") : (locale === "ar" ? "منتج جديد" : "New product")}</h2>
            <Button size="icon" variant="ghost" onClick={() => setEditing(null)}><X className="h-4 w-4" /></Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Slug *</Label><Input value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></div>
            <div>
              <Label>{locale === "ar" ? "الفئة" : "Category"} *</Label>
              <select className="flex h-10 w-full rounded-md border bg-background px-3 text-sm" value={editing.category ?? "solar_panels"} onChange={(e) => setEditing({ ...editing, category: e.target.value as P["category"] })}>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><Label>{locale === "ar" ? "الاسم بالعربية" : "Name (AR)"} *</Label><Input value={editing.name_ar ?? ""} onChange={(e) => setEditing({ ...editing, name_ar: e.target.value })} /></div>
            <div><Label>{locale === "ar" ? "الاسم بالإنجليزية" : "Name (EN)"} *</Label><Input value={editing.name_en ?? ""} onChange={(e) => setEditing({ ...editing, name_en: e.target.value })} /></div>
            <div><Label>{locale === "ar" ? "العلامة" : "Brand"}</Label><Input value={editing.brand ?? ""} onChange={(e) => setEditing({ ...editing, brand: e.target.value })} /></div>
            <div><Label>{locale === "ar" ? "السعر" : "Price"} *</Label><Input type="number" value={editing.price ?? 0} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} /></div>
            <div><Label>{locale === "ar" ? "سعر المقارنة" : "Compare at"}</Label><Input type="number" value={editing.compare_at_price ?? ""} onChange={(e) => setEditing({ ...editing, compare_at_price: e.target.value ? Number(e.target.value) : null })} /></div>
            <div><Label>{locale === "ar" ? "المخزون" : "Stock"}</Label><Input type="number" value={editing.stock ?? 0} onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) })} /></div>
            <div className="sm:col-span-2"><Label>{locale === "ar" ? "رابط الصورة" : "Image URL"}</Label><Input value={editing.image_url ?? ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>{locale === "ar" ? "الوصف بالعربية" : "Description (AR)"}</Label><Textarea value={editing.description_ar ?? ""} onChange={(e) => setEditing({ ...editing, description_ar: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>{locale === "ar" ? "الوصف بالإنجليزية" : "Description (EN)"}</Label><Textarea value={editing.description_en ?? ""} onChange={(e) => setEditing({ ...editing, description_en: e.target.value })} /></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!editing.is_featured} onChange={(e) => setEditing({ ...editing, is_featured: e.target.checked })} />{locale === "ar" ? "مميز" : "Featured"}</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.is_active ?? true} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />{locale === "ar" ? "نشط" : "Active"}</label>
          </div>
          <Button className="mt-4" onClick={() => save.mutate(editing)} disabled={save.isPending}>
            <Save className="h-4 w-4" /><span className="ms-1">{locale === "ar" ? "حفظ" : "Save"}</span>
          </Button>
        </div>
      )}

      <div className="rounded-xl border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-start">
            <tr>
              <th className="p-3 text-start">{locale === "ar" ? "الاسم" : "Name"}</th>
              <th className="p-3 text-start">{locale === "ar" ? "الفئة" : "Category"}</th>
              <th className="p-3 text-start">{locale === "ar" ? "السعر" : "Price"}</th>
              <th className="p-3 text-start">{locale === "ar" ? "المخزون" : "Stock"}</th>
              <th className="p-3 text-start">{locale === "ar" ? "الحالة" : "Status"}</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="p-3 font-medium">{locale === "ar" ? p.name_ar : p.name_en}</td>
                <td className="p-3 text-muted-foreground">{p.category}</td>
                <td className="p-3">{formatPrice(Number(p.price), locale)}</td>
                <td className="p-3">{p.stock}</td>
                <td className="p-3"><span className={`inline-block rounded-full px-2 py-0.5 text-xs ${p.is_active ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"}`}>{p.is_active ? "active" : "hidden"}</span></td>
                <td className="p-3 text-end">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(p)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => confirm(locale === "ar" ? "متأكد؟" : "Delete?") && del.mutate(p.id)}><Trash2 className="h-4 w-4" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
