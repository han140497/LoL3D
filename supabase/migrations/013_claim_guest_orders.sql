-- Links guest orders (user_id IS NULL) to a signed-in user whose auth email
-- matches the email stored on the order. Called client-side after SIGNED_IN.
create or replace function public.claim_guest_orders()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email   text;
begin
  if v_user_id is null then return; end if;

  select email into v_email
  from auth.users
  where id = v_user_id;

  if v_email is null or v_email = '' then return; end if;

  update public.orders
  set user_id = v_user_id
  where user_id is null
    and lower(email) = lower(v_email);
end;
$$;

grant execute on function public.claim_guest_orders() to authenticated;
