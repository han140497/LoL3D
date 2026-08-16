-- Add user_id to sculpture_requests (mirrors 014 for quote_requests).
ALTER TABLE public.sculpture_requests
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

CREATE POLICY "users read own sculpture requests"
  ON public.sculpture_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Extend claim_guest_orders() to also claim sculpture requests on sign-in.
CREATE OR REPLACE FUNCTION public.claim_guest_orders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_email   text;
BEGIN
  IF v_user_id IS NULL THEN RETURN; END IF;

  SELECT email INTO v_email
  FROM auth.users
  WHERE id = v_user_id;

  IF v_email IS NULL OR v_email = '' THEN RETURN; END IF;

  UPDATE public.orders
  SET user_id = v_user_id
  WHERE user_id IS NULL
    AND lower(email) = lower(v_email);

  UPDATE public.quote_requests
  SET user_id = v_user_id
  WHERE user_id IS NULL
    AND lower(contact) = lower(v_email);

  UPDATE public.sculpture_requests
  SET user_id = v_user_id
  WHERE user_id IS NULL
    AND lower(contact) = lower(v_email);
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_guest_orders() TO authenticated;
