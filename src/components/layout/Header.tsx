import { Link, useRouterState } from "@tanstack/react-router";
import { Sun, ShoppingCart, User, Calculator, Sparkles, Menu, X, Languages, Heart, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { useIsAdmin } from "@/lib/use-admin";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function useCartCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["cart-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase.from("cart_items").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      return count ?? 0;
    },
    enabled: !!user,
  });
}

export function Header() {
  const { t, locale, setLocale } = useI18n();
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: cartCount = 0 } = useCartCount();

  const links = [
    { to: "/", label: t("nav.home") },
    { to: "/products", label: t("nav.products") },
    { to: "/calculators", label: t("nav.calculators"), icon: Calculator },
    { to: "/ai-advisor", label: t("nav.ai"), icon: Sparkles },
  ];

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg gradient-primary shadow-glow">
              <Sun className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">SolarHub</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => {
              const active = pathname === l.to;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setLocale(locale === "ar" ? "en" : "ar")}>
            <Languages className="h-4 w-4" />
            <span className="ms-1 hidden sm:inline">{t("common.language")}</span>
          </Button>
          <Link to="/wishlist" className="hidden sm:inline-flex">
            <Button variant="ghost" size="icon" aria-label="wishlist">
              <Heart className="h-5 w-5" />
            </Button>
          </Link>
          <Link to="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -end-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {cartCount}
                </span>
              )}
            </Button>
          </Link>
          {isAdmin && (
            <Link to="/admin" className="hidden md:inline-flex">
              <Button variant="outline" size="sm">
                <LayoutDashboard className="h-4 w-4" />
                <span className="ms-1">{t("nav.admin")}</span>
              </Button>
            </Link>
          )}
          {user ? (
            <Link to="/account">
              <Button variant="outline" size="sm">
                <User className="h-4 w-4" />
                <span className="ms-1 hidden sm:inline">{t("nav.account")}</span>
              </Button>
            </Link>
          ) : (
            <Link to="/auth">
              <Button size="sm">{t("nav.signin")}</Button>
            </Link>
          )}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      {open && (
        <div className="border-t bg-background md:hidden">
          <nav className="flex flex-col p-2">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                {l.label}
              </Link>
            ))}
            {user && (
              <button
                onClick={() => {
                  signOut();
                  setOpen(false);
                }}
                className="rounded-md px-3 py-2 text-start text-sm font-medium text-destructive hover:bg-muted"
              >
                {t("nav.signout")}
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mt-16 border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} SolarHub — {t("home.hero.badge")}</p>
      </div>
    </footer>
  );
}
