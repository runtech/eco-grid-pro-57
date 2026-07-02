import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Calculator } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/calculators")({
  component: CalculatorsPage,
  head: () => ({
    meta: [
      { title: "الحاسبات الهندسية — SolarHub" },
      { name: "description", content: "حاسبات الأحمال، تصميم المنظومة الشمسية، حاسبة ROI ومدة الاسترداد." },
      { property: "og:title", content: "Solar Engineering Calculators — SolarHub" },
      { property: "og:description", content: "Load calc, system sizing, and ROI calculators." },
      { property: "og:url", content: "/calculators" },
    ],
    links: [{ rel: "canonical", href: "/calculators" }],
  }),
});

function CalculatorsPage() {
  const { t, locale } = useI18n();
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 text-center">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl gradient-primary shadow-glow">
        <Calculator className="h-8 w-8 text-primary-foreground" />
      </div>
      <h1 className="mb-3 text-3xl font-bold">{t("nav.calculators")}</h1>
      <p className="mx-auto max-w-xl text-muted-foreground">
        {locale === "ar"
          ? "حاسبة الأحمال الكهربائية، تصميم المنظومة الشمسية، وحاسبة ROI ستكون متاحة في المرحلة القادمة."
          : "Load calculator, solar system designer, and ROI calculator arrive in the next phase."}
      </p>
      <div className="mx-auto mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
        <Sparkles className="h-4 w-4" />
        {locale === "ar" ? "قريباً — المرحلة 4" : "Coming — Phase 4"}
      </div>
    </div>
  );
}
