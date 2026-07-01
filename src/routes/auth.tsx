import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Sun } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/account" });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName, phone },
          },
        });
        if (error) throw error;
        toast.success(locale === "ar" ? "تم إنشاء الحساب" : "Account created");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(locale === "ar" ? "أهلاً بك" : "Welcome back");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (result.error) toast.error(String(result.error));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-md place-items-center px-4 py-8">
      <div className="w-full rounded-2xl border bg-card p-6 shadow-elegant">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl gradient-primary shadow-glow">
            <Sun className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">{mode === "signin" ? t("auth.signin.title") : t("auth.signup.title")}</h1>
        </div>

        <Button variant="outline" className="w-full" onClick={google} disabled={loading}>
          {t("auth.google")}
        </Button>

        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          <span>{locale === "ar" ? "أو" : "or"}</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <>
              <div className="space-y-1">
                <Label>{t("auth.name")}</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>{t("auth.phone")}</Label>
                <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </>
          )}
          <div className="space-y-1">
            <Label>{t("auth.email")}</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>{t("auth.password")}</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <Button type="submit" className="w-full gradient-primary border-0" disabled={loading}>
            {mode === "signin" ? t("auth.submit.signin") : t("auth.submit.signup")}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-center text-sm text-primary hover:underline"
        >
          {mode === "signin" ? t("auth.switch.toSignup") : t("auth.switch.toSignin")}
        </button>
      </div>
    </div>
  );
}
