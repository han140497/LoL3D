-- Add user_id to quote_requests so logged-in customers can see their requests
-- on the Account page, and claim_guest_orders() can backfill them on sign-in.

ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Allow users to read their own requests (admins already have a separate policy)
CREATE POLICY "users read own quote requests"
  ON public.quote_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Update claim_guest_orders() to also claim quote requests on sign-in
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
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_guest_orders() TO authenticated;
