ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'cod',
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending';

ALTER TABLE public.orders 
  ADD CONSTRAINT orders_payment_method_check 
  CHECK (payment_method IN ('cod','jaib','onecash'));

ALTER TABLE public.orders 
  ADD CONSTRAINT orders_payment_status_check 
  CHECK (payment_status IN ('pending','paid','failed','refunded'));