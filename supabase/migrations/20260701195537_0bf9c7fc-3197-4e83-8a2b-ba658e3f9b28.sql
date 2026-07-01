CREATE TYPE public.app_role AS ENUM ('admin', 'technician', 'driver', 'customer');
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned');
CREATE TYPE public.product_category AS ENUM ('solar_panels', 'batteries', 'inverters', 'charge_controllers', 'appliances', 'accessories', 'complete_systems');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'ar',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, app_role) TO authenticated;

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  category product_category NOT NULL,
  brand TEXT,
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  compare_at_price NUMERIC(12,2),
  currency TEXT NOT NULL DEFAULT 'YER',
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url TEXT,
  gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  specs JSONB NOT NULL DEFAULT '{}'::jsonb,
  rating NUMERIC(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE INDEX products_category_active_idx ON public.products (category) WHERE is_active;
CREATE INDEX products_featured_active_idx ON public.products (is_featured) WHERE is_active;
CREATE POLICY "products_select_active_public" ON public.products FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "products_admin_all" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT ALL ON public.cart_items TO service_role;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cart_own_all" ON public.cart_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL DEFAULT 'ORD-' || substr(gen_random_uuid()::text, 1, 8),
  user_id UUID NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  subtotal NUMERIC(12,2) NOT NULL,
  shipping_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'YER',
  shipping_address JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_select_own" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "orders_insert_own" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "orders_admin_all" ON public.orders FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  line_total NUMERIC(12,2) NOT NULL
);
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_items_select_own" ON public.order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
CREATE POLICY "order_items_insert_own" ON public.order_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
CREATE POLICY "order_items_admin_all" ON public.order_items FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

INSERT INTO public.products (slug, name_ar, name_en, description_ar, description_en, category, brand, price, compare_at_price, stock, is_featured, specs) VALUES
('lithium-battery-200ah', 'بطارية ليثيوم 200 أمبير 12 فولت', 'Lithium Battery 200Ah 12V', 'بطارية ليثيوم LiFePO4 عالية الكفاءة، تدعم أكثر من 6000 دورة شحن، مثالية لأنظمة الطاقة الشمسية المنزلية.', 'High-efficiency LiFePO4 lithium battery, 6000+ cycles, ideal for home solar systems.', 'batteries', 'SolarMax', 850000, 950000, 25, true, '{"voltage":"12V","capacity_ah":200,"chemistry":"LiFePO4","cycles":6000,"warranty_years":5}'::jsonb),
('mono-solar-panel-550w', 'لوح شمسي مونو 550 واط', 'Mono Solar Panel 550W', 'لوح شمسي أحادي البلورة عالي الكفاءة 21%، مقاوم للعوامل الجوية.', 'Monocrystalline high-efficiency solar panel with 21% efficiency, weather-resistant.', 'solar_panels', 'JinkoPower', 145000, 170000, 60, true, '{"power_w":550,"efficiency":"21%","cell_type":"Mono PERC","warranty_years":25}'::jsonb),
('mppt-controller-60a', 'منظم شحن MPPT 60 أمبير', 'MPPT Charge Controller 60A', 'منظم MPPT ذكي بكفاءة 98%، يدعم بطاريات الليثيوم والجل والسائلة.', 'Smart MPPT controller with 98% efficiency, supports lithium, gel, and flooded batteries.', 'charge_controllers', 'EPEVER', 195000, NULL, 40, true, '{"current_a":60,"max_pv_voltage":150,"efficiency":"98%","battery_types":["Li","Gel","AGM"]}'::jsonb),
('hybrid-inverter-5kw', 'إنفرتر هجين 5 كيلو واط', 'Hybrid Inverter 5kW', 'إنفرتر هجين متكامل يعمل مع الشبكة والبطاريات، مع شاشة LCD ذكية.', 'All-in-one hybrid inverter for grid and battery, smart LCD display.', 'inverters', 'Growatt', 620000, 720000, 15, true, '{"power_kw":5,"input_voltage":"48V","output":"220V/50Hz","warranty_years":5}'::jsonb),
('solar-fridge-200l', 'ثلاجة شمسية 200 لتر DC', 'Solar DC Fridge 200L', 'ثلاجة تعمل مباشرة على التيار المستمر 12/24 فولت، استهلاك منخفض.', 'DC-powered fridge running directly on 12/24V, ultra-low power consumption.', 'appliances', 'SunFrost', 480000, NULL, 8, false, '{"volume_l":200,"voltage":"12/24V DC","daily_wh":420}'::jsonb),
('complete-system-3kw', 'منظومة كاملة 3 كيلو واط', 'Complete 3kW Solar System', 'منظومة جاهزة: 6 ألواح 550 واط + إنفرتر هجين 3kW + بطارية ليثيوم 200Ah + كوابل وإكسسوارات.', 'Ready system: 6×550W panels + 3kW hybrid inverter + 200Ah lithium battery + cables.', 'complete_systems', 'SolarMax', 2450000, 2800000, 5, true, '{"total_power_kw":3,"panels":6,"battery_ah":200,"includes":["panels","inverter","battery","cables","mounts"]}'::jsonb);