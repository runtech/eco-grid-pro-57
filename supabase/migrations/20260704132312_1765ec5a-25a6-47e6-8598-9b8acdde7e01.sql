
REVOKE EXECUTE ON FUNCTION public.decrement_stock_on_confirm() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_order_shipping_timestamps() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalc_product_rating() FROM PUBLIC, anon, authenticated;
