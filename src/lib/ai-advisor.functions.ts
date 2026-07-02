import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const inputSchema = z.object({
  usageKwhPerDay: z.number().min(0).max(500),
  budget: z.number().min(0).max(100_000_000),
  location: z.string().max(120).optional(),
  notes: z.string().max(1000).optional(),
  locale: z.enum(["ar", "en"]).default("ar"),
});

export type AdvisorInput = z.infer<typeof inputSchema>;

export type AdvisorTier = {
  tier: "budget" | "balanced" | "premium";
  title: string;
  summary: string;
  totalEstimate: number;
  currency: string;
  items: { category: string; name: string; qty: number; price: number; reason: string }[];
};

export type AdvisorResult = {
  intro: string;
  tiers: AdvisorTier[];
  notes: string;
};

export const getAdvice = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => inputSchema.parse(raw))
  .handler(async ({ data }): Promise<AdvisorResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const { data: products } = await supabase
      .from("products")
      .select("id,name_ar,name_en,category,price,currency,brand,specs,stock")
      .eq("is_active", true)
      .limit(80);

    const catalog = (products ?? []).map((p) => ({
      id: p.id,
      name: data.locale === "ar" ? p.name_ar : p.name_en,
      category: p.category,
      price: Number(p.price),
      currency: p.currency,
      brand: p.brand,
    }));

    const system =
      data.locale === "ar"
        ? "أنت مستشار هندسي للطاقة الشمسية. اقترح 3 حلول (اقتصادي/متوسط/احترافي) اعتماداً على الاستهلاك اليومي والميزانية والمنتجات المتاحة فقط. أعِد JSON صالحًا فقط بدون أي شرح إضافي."
        : "You are a solar engineering advisor. Suggest 3 tiers (budget/balanced/premium) based on daily usage, budget, and only the provided catalog. Return VALID JSON only, no prose.";

    const schemaHint = `{
  "intro": string,
  "tiers": [ { "tier": "budget"|"balanced"|"premium", "title": string, "summary": string, "totalEstimate": number, "currency": string, "items": [ { "category": string, "name": string, "qty": number, "price": number, "reason": string } ] } ],
  "notes": string
}`;

    const userMsg = `Usage: ${data.usageKwhPerDay} kWh/day
Budget: ${data.budget}
Location: ${data.location ?? "-"}
Extra: ${data.notes ?? "-"}
Catalog (JSON): ${JSON.stringify(catalog)}
Return JSON with this exact shape: ${schemaHint}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: userMsg },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429) throw new Error("AI rate limit — please retry shortly.");
      if (res.status === 402) throw new Error("AI credits exhausted — add credits.");
      throw new Error(`AI error ${res.status}: ${body.slice(0, 200)}`);
    }

    const json = await res.json();
    const content: string = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: AdvisorResult;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("AI returned invalid JSON");
    }
    return parsed;
  });
