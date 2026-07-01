import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Locale = "ar" | "en";

type Dict = Record<string, { ar: string; en: string }>;

const dict: Dict = {
  // Nav
  "nav.home": { ar: "الرئيسية", en: "Home" },
  "nav.products": { ar: "المنتجات", en: "Products" },
  "nav.calculators": { ar: "الحاسبات", en: "Calculators" },
  "nav.ai": { ar: "المستشار الذكي", en: "AI Advisor" },
  "nav.cart": { ar: "السلة", en: "Cart" },
  "nav.account": { ar: "حسابي", en: "Account" },
  "nav.admin": { ar: "لوحة التحكم", en: "Admin" },
  "nav.signin": { ar: "دخول", en: "Sign in" },
  "nav.signout": { ar: "خروج", en: "Sign out" },
  // Home
  "home.hero.badge": { ar: "منصة الأتمتة الشاملة للطاقة الشمسية", en: "Full-stack solar automation" },
  "home.hero.title": { ar: "طاقة شمسية ذكية. حلول متكاملة. توصيل فوري.", en: "Smart solar energy. Complete solutions. Instant delivery." },
  "home.hero.subtitle": {
    ar: "متجر، مستشار هندسي بالذكاء الاصطناعي، حاسبات دقيقة، وشبكة توصيل وفنيين — كل ذلك في مكان واحد.",
    en: "Marketplace, AI engineering advisor, precise calculators, and a delivery and technician network — all in one place.",
  },
  "home.hero.cta.shop": { ar: "تصفح المنتجات", en: "Shop products" },
  "home.hero.cta.ai": { ar: "استشر الذكاء الاصطناعي", en: "Ask the AI" },
  "home.categories.title": { ar: "الفئات", en: "Categories" },
  "home.featured.title": { ar: "منتجات مميزة", en: "Featured Products" },
  "home.features.title": { ar: "لماذا منصتنا؟", en: "Why our platform?" },
  "home.features.ai.title": { ar: "مستشار ذكاء اصطناعي", en: "AI Sales Advisor" },
  "home.features.ai.desc": { ar: "يقترح لك 3 حلول: اقتصادي، متوسط، احترافي.", en: "Suggests 3 tailored solutions: budget, balanced, premium." },
  "home.features.eng.title": { ar: "حاسبات هندسية دقيقة", en: "Precise Engineering" },
  "home.features.eng.desc": { ar: "حساب الأحمال، تصميم المنظومة، حساب ROI.", en: "Load calc, system design, ROI calculator." },
  "home.features.logi.title": { ar: "لوجستيات ذكية", en: "Smart Logistics" },
  "home.features.logi.desc": { ar: "تتبع لحظي وسائقون معتمدون.", en: "Real-time tracking & verified drivers." },
  // Categories
  "cat.solar_panels": { ar: "ألواح شمسية", en: "Solar Panels" },
  "cat.batteries": { ar: "بطاريات", en: "Batteries" },
  "cat.inverters": { ar: "إنفرترات", en: "Inverters" },
  "cat.charge_controllers": { ar: "منظمات شحن", en: "Charge Controllers" },
  "cat.appliances": { ar: "أجهزة", en: "Appliances" },
  "cat.accessories": { ar: "إكسسوارات", en: "Accessories" },
  "cat.complete_systems": { ar: "منظومات كاملة", en: "Complete Systems" },
  // Products
  "products.title": { ar: "المنتجات", en: "Products" },
  "products.filter.all": { ar: "الكل", en: "All" },
  "products.empty": { ar: "لا توجد منتجات", en: "No products found" },
  "products.addToCart": { ar: "إضافة للسلة", en: "Add to cart" },
  "products.viewDetails": { ar: "عرض التفاصيل", en: "View details" },
  "products.inStock": { ar: "متوفر", en: "In stock" },
  "products.outOfStock": { ar: "غير متوفر", en: "Out of stock" },
  "products.specs": { ar: "المواصفات التقنية", en: "Technical specs" },
  "products.brand": { ar: "العلامة التجارية", en: "Brand" },
  // Cart
  "cart.title": { ar: "سلة التسوق", en: "Shopping Cart" },
  "cart.empty": { ar: "سلتك فارغة", en: "Your cart is empty" },
  "cart.empty.cta": { ar: "ابدأ التسوق", en: "Start shopping" },
  "cart.subtotal": { ar: "المجموع الفرعي", en: "Subtotal" },
  "cart.shipping": { ar: "الشحن", en: "Shipping" },
  "cart.total": { ar: "الإجمالي", en: "Total" },
  "cart.checkout": { ar: "إتمام الشراء", en: "Checkout" },
  "cart.remove": { ar: "حذف", en: "Remove" },
  "cart.qty": { ar: "الكمية", en: "Qty" },
  // Auth
  "auth.signin.title": { ar: "تسجيل الدخول", en: "Sign in" },
  "auth.signup.title": { ar: "إنشاء حساب", en: "Create account" },
  "auth.email": { ar: "البريد الإلكتروني", en: "Email" },
  "auth.password": { ar: "كلمة المرور", en: "Password" },
  "auth.name": { ar: "الاسم الكامل", en: "Full name" },
  "auth.phone": { ar: "رقم الهاتف", en: "Phone number" },
  "auth.submit.signin": { ar: "دخول", en: "Sign in" },
  "auth.submit.signup": { ar: "إنشاء حساب", en: "Create account" },
  "auth.google": { ar: "المتابعة عبر Google", en: "Continue with Google" },
  "auth.switch.toSignup": { ar: "ليس لديك حساب؟ سجل الآن", en: "No account? Sign up" },
  "auth.switch.toSignin": { ar: "لديك حساب؟ سجل الدخول", en: "Have an account? Sign in" },
  // Account
  "account.title": { ar: "حسابي", en: "My Account" },
  "account.orders": { ar: "طلباتي", en: "My Orders" },
  "account.profile": { ar: "الملف الشخصي", en: "Profile" },
  "account.noOrders": { ar: "لا توجد طلبات بعد", en: "No orders yet" },
  // Common
  "common.loading": { ar: "جاري التحميل...", en: "Loading..." },
  "common.currency": { ar: "ريال", en: "YER" },
  "common.save": { ar: "حفظ", en: "Save" },
  "common.cancel": { ar: "إلغاء", en: "Cancel" },
  "common.language": { ar: "English", en: "العربية" },
};

interface I18nCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
  dir: "rtl" | "ltr";
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ar");

  useEffect(() => {
    const stored = (typeof window !== "undefined" && (localStorage.getItem("locale") as Locale | null)) || "ar";
    setLocaleState(stored);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
      document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    }
  }, [locale]);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    if (typeof window !== "undefined") localStorage.setItem("locale", l);
  };

  const t = (key: string) => dict[key]?.[locale] ?? key;

  return (
    <Ctx.Provider value={{ locale, setLocale, t, dir: locale === "ar" ? "rtl" : "ltr" }}>
      {children}
    </Ctx.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export function formatPrice(price: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-YE" : "en-US", {
    maximumFractionDigits: 0,
  }).format(price);
}
