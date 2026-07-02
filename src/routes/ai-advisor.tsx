import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getAdvice, type AdvisorResult } from "@/lib/ai-advisor.functions";

export const Route = createFileRoute("/ai-advisor")({
  component: AIPage,
  head: () => ({
    meta: [
      { title: "المستشار الذكي — SolarHub" },
      { name: "description", content: "مستشار هندسي بالذكاء الاصطناعي يقترح 3 حلول شمسية (اقتصادي / متوسط / احترافي) بناءً على استهلاكك وميزانيتك." },
      { property: "og:title", content: "AI Solar Advisor — SolarHub" },
      { property: "og:description", content: "AI-powered solar advisor: budget / balanced / premium solutions tailored to your usage." },
      { property: "og:url", content: "/ai-advisor" },
    ],
    links: [{ rel: "canonical", href: "/ai-advisor" }],
  }),
});

function AIPage() {
  const { locale } = useI18n();
  const isAr = locale === "ar";
  const advise = useServerFn(getAdvice);
  const [usage, setUsage] = useState(10);
  const [budget, setBudget] = useState(2000000);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<AdvisorResult | null>(null);

  const mutation = useMutation({
    mutationFn: () => advise({ data: { usageKwhPerDay: usage, budget, location, notes, locale } }),
    onSuccess: (r) => setResult(r),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8 text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl gradient-primary shadow-glow">
          <Sparkles className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="mb-2 text-3xl font-bold">{isAr ? "المستشار الذكي" : "AI Advisor"}</h1>
        <p className="text-muted-foreground">
          {isAr
            ? "أدخل استهلاكك اليومي وميزانيتك، وسنقترح 3 حلول من منتجاتنا."
            : "Enter your daily usage & budget, we'll suggest 3 tailored solutions."}
        </p>
      </header>

      <form
        className="grid gap-4 rounded-2xl border bg-card p-6 shadow-sm md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <div className="space-y-2">
          <Label>{isAr ? "الاستهلاك اليومي (kWh)" : "Daily usage (kWh)"}</Label>
          <Input type="number" min={0} step="0.1" value={usage} onChange={(e) => setUsage(Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label>{isAr ? "الميزانية" : "Budget"}</Label>
          <Input type="number" min={0} value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label>{isAr ? "الموقع (اختياري)" : "Location (optional)"}</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder={isAr ? "مثال: صنعاء" : "e.g. Sana'a"} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>{isAr ? "ملاحظات إضافية" : "Extra notes"}</Label>
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {isAr ? "جاري التحليل..." : "Analyzing..."}
              </>
            ) : (
              <>
                <Sparkles className="me-2 h-4 w-4" />
                {isAr ? "اقترح حلولاً" : "Suggest solutions"}
              </>
            )}
          </Button>
        </div>
      </form>

      {result && (
        <section className="mt-10 space-y-6">
          {result.intro && <p className="rounded-lg bg-accent p-4 text-accent-foreground">{result.intro}</p>}
          <div className="grid gap-6 md:grid-cols-3">
            {result.tiers?.map((tier) => (
              <article key={tier.tier} className="rounded-2xl border bg-card p-6 shadow-sm">
                <div className="mb-2 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase text-primary">
                  {tier.tier}
                </div>
                <h3 className="text-xl font-bold">{tier.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{tier.summary}</p>
                <div className="my-4 text-2xl font-bold">
                  {tier.totalEstimate?.toLocaleString()} {tier.currency}
                </div>
                <ul className="space-y-3 text-sm">
                  {tier.items?.map((it, i) => (
                    <li key={i} className="border-t pt-3">
                      <div className="flex justify-between font-medium">
                        <span>
                          {it.name} × {it.qty}
                        </span>
                        <span>{(it.price * it.qty).toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{it.reason}</div>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          {result.notes && <p className="text-sm text-muted-foreground">{result.notes}</p>}
        </section>
      )}
    </div>
  );
}
