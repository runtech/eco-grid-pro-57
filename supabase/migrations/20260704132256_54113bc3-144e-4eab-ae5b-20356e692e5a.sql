
-- Product inventory fields
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS sku TEXT;

-- Order logistics fields
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS carrier TEXT,
  ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- Stock movements log
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  change INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  note TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.stock_movements TO authenticated;
GRANT ALL ON public.stock_movements TO service_role;

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view stock movements"
  ON public.stock_movements FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert stock movements"
  ON public.stock_movements FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON public.stock_movements(product_id, created_at DESC);

-- Auto set shipped_at/delivered_at when status changes
CREATE OR REPLACE FUNCTION public.sync_order_shipping_timestamps()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'shipped' AND OLD.status IS DISTINCT FROM 'shipped' AND NEW.shipped_at IS NULL THEN
    NEW.shipped_at := now();
  END IF;
  IF NEW.status = 'delivered' AND OLD.status IS DISTINCT FROM 'delivered' AND NEW.delivered_at IS NULL THEN
    NEW.delivered_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_shipping_timestamps ON public.orders;
CREATE TRIGGER trg_orders_shipping_timestamps
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_order_shipping_timestamps();

-- Auto decrement stock on order confirmation
CREATE OR REPLACE FUNCTION public.decrement_stock_on_confirm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item RECORD;
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status IS DISTINCT FROM 'confirmed' THEN
    FOR item IN SELECT product_id, quantity FROM public.order_items WHERE order_id = NEW.id LOOP
      UPDATE public.products SET stock = GREATEST(stock - item.quantity, 0) WHERE id = item.product_id;
      INSERT INTO public.stock_movements (product_id, change, reason, reference_type, reference_id, note)
        VALUES (item.product_id, -item.quantity, 'order_confirmed', 'order', NEW.id, NEW.order_number);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_decrement_stock ON public.orders;
CREATE TRIGGER trg_orders_decrement_stock
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.decrement_stock_on_confirm();
