import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/ai-advisor")({
  component: AIPage,
});

function AIPage() {
  const { t, locale } = useI18n();
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 text-center">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl gradient-primary shadow-glow">
        <Sparkles className="h-8 w-8 text-primary-foreground" />
      </div>
      <h1 className="mb-3 text-3xl font-bold">{t("nav.ai")}</h1>
      <p className="mx-auto max-w-xl text-muted-foreground">
        {locale === "ar"
          ? "المستشار الذكي (شات مبيعات مدعوم بالذكاء الاصطناعي، بحث دلالي، اقتراح 3 حلول) سيُطلق في المرحلة القادمة."
          : "AI sales advisor (chat, semantic search, 3-tier system suggestions) launches in the next phase."}
      </p>
      <div className="mx-auto mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
        <Sparkles className="h-4 w-4" />
        {locale === "ar" ? "قريباً — المرحلة 3" : "Coming — Phase 3"}
      </div>
    </div>
  );
}
