import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Sparkles, Calculator, Truck, ArrowLeft, Sun, Battery, Zap, Cpu, Refrigerator, Package, Layers } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";

const CATEGORIES = [
  { key: "solar_panels", icon: Sun },
  { key: "batteries", icon: Battery },
  { key: "inverters", icon: Zap },
  { key: "charge_controllers", icon: Cpu },
  { key: "appliances", icon: Refrigerator },
  { key: "complete_systems", icon: Layers },
  { key: "accessories", icon: Package },
] as const;

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { t, locale } = useI18n();

  const { data: featured = [] } = useQuery({
    queryKey: ["products-featured"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("is_featured", true).eq("is_active", true).limit(8);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      {/* HERO */}
      <section className="gradient-hero relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex flex-col justify-center gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border bg-card/80 px-3 py-1 text-xs font-medium text-primary shadow-sm">
              <Sparkles className="h-3.5 w-3.5" /> {t("home.hero.badge")}
            </span>
            <h1 className="text-4xl font-black leading-tight tracking-tight md:text-6xl">
              {t("home.hero.title")}
            </h1>
            <p className="text-lg text-muted-foreground md:text-xl">{t("home.hero.subtitle")}</p>
            <div className="flex flex-wrap gap-3">
              <Link to="/products">
                <Button size="lg" className="gradient-primary shadow-glow border-0">
                  {t("home.hero.cta.shop")}
                  <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                </Button>
              </Link>
              <Link to="/ai-advisor">
                <Button size="lg" variant="outline">
                  <Sparkles className="h-4 w-4" />
                  {t("home.hero.cta.ai")}
                </Button>
              </Link>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }} className="relative hidden md:block">
            <div className="absolute inset-0 gradient-primary rounded-3xl blur-3xl opacity-30" />
            <div className="relative aspect-square rounded-3xl border bg-card p-8 shadow-elegant">
              <div className="grid h-full grid-cols-2 gap-4">
                {[Sun, Battery, Zap, Cpu].map((Icon, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-accent/60 to-muted p-6"
                  >
                    <Icon className="h-10 w-10 text-primary" />
                    <span className="text-xs font-medium">{t(`cat.${["solar_panels","batteries","inverters","charge_controllers"][i]}`)}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="mb-8 text-2xl font-bold md:text-3xl">{t("home.categories.title")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
          {CATEGORIES.map(({ key, icon: Icon }) => (
            <Link
              key={key}
              to="/products"
              search={{ category: key }}
              className="group flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center transition-all hover:border-primary hover:shadow-glow"
            >
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-accent transition-colors group-hover:gradient-primary">
                <Icon className="h-6 w-6 text-primary group-hover:text-primary-foreground" />
              </div>
              <span className="text-xs font-medium">{t(`cat.${key}`)}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold md:text-3xl">{t("home.featured.title")}</h2>
          <Link to="/products" className="text-sm text-primary hover:underline">
            {locale === "ar" ? "عرض الكل ←" : "View all →"}
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="mb-8 text-center text-2xl font-bold md:text-3xl">{t("home.features.title")}</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Sparkles, title: t("home.features.ai.title"), desc: t("home.features.ai.desc") },
            { icon: Calculator, title: t("home.features.eng.title"), desc: t("home.features.eng.desc") },
            { icon: Truck, title: t("home.features.logi.title"), desc: t("home.features.logi.desc") },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border bg-card p-6 shadow-sm"
            >
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl gradient-primary shadow-glow">
                <f.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-bold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
