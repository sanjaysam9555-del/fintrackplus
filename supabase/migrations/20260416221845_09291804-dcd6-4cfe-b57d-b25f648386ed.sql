UPDATE public.subscriptions
SET status = 'expired'
WHERE status = 'created'
  AND razorpay_subscription_id IS NOT NULL
  AND is_comped = false;