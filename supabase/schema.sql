create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 60),
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null unique references auth.users (id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'member')),
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table if not exists public.household_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  email text not null,
  invited_by uuid not null references auth.users (id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  household_id uuid references public.households (id) on delete cascade,
  member_id uuid references auth.users (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  merchant text not null check (merchant in (
    'Express Delivery App',
    'Amazon',
    'Flipkart',
    'Meesho',
    'Myntra',
    'Dmart',
    'RatanDip',
    'Vijetha',
    'Swiggy',
    'Zomato',
    'Restaurant',
    'Rent',
    'Maintenance',
    'Electricity Bill',
    'Water Bill',
    'Newspaper',
    'Internet Bill',
    'Fuel',
    'OTT Subscriptions',
    'Other'
  )),
  merchant_name text,
  expense_date date not null,
  amount numeric(12, 2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

alter table public.expenses add column if not exists household_id uuid references public.households (id) on delete cascade;
alter table public.expenses add column if not exists member_id uuid references auth.users (id) on delete set null;
alter table public.expenses add column if not exists created_by uuid references auth.users (id) on delete set null;
alter table public.expenses add column if not exists merchant_name text;
alter table public.expenses alter column user_id drop not null;

alter table public.expenses drop constraint if exists expenses_merchant_check;
alter table public.expenses add constraint expenses_merchant_check check (merchant in (
  'Express Delivery App', 'Amazon', 'Flipkart', 'Meesho', 'Myntra', 'Dmart',
  'RatanDip', 'Vijetha', 'Swiggy', 'Zomato', 'Restaurant', 'Rent',
  'Maintenance', 'Electricity Bill', 'Water Bill', 'Newspaper', 'Internet Bill',
  'Fuel', 'OTT Subscriptions', 'Other'
));
alter table public.expenses drop constraint if exists expenses_merchant_name_check;
alter table public.expenses add constraint expenses_merchant_name_check check (
  (merchant in ('Other', 'Restaurant', 'OTT Subscriptions')
    and merchant_name is not null
    and length(trim(merchant_name)) between 1 and 120)
  or
  (merchant not in ('Other', 'Restaurant', 'OTT Subscriptions') and merchant_name is null)
) not valid;

update public.expenses
set created_by = user_id
where created_by is null and user_id is not null;

update public.expenses
set member_id = coalesce(user_id, created_by)
where member_id is null;

create table if not exists public.household_finances (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  member_id uuid not null references auth.users (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete restrict,
  kind text not null check (kind in ('earning', 'investment', 'loan_repayment')),
  category text not null check (length(trim(category)) between 1 and 60),
  description text not null check (length(trim(description)) between 1 and 120),
  record_date date not null,
  amount numeric(12, 2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.household_loans (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  member_id uuid not null references auth.users (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete restrict,
  name text not null check (length(trim(name)) between 1 and 120),
  lender text not null check (length(trim(lender)) between 1 and 120),
  principal numeric(12, 2) not null check (principal > 0),
  emi_amount numeric(12, 2) not null check (emi_amount > 0),
  due_day smallint not null check (due_day between 1 and 31),
  start_date date not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.household_loan_payments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  loan_id uuid not null references public.household_loans (id) on delete cascade,
  member_id uuid not null references auth.users (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete restrict,
  period_month date not null check (extract(day from period_month) = 1),
  payment_date date not null,
  amount numeric(12, 2) not null check (amount > 0),
  created_at timestamptz not null default now(),
  unique (loan_id, period_month)
);

create index if not exists household_members_user_idx
  on public.household_members (user_id);
create index if not exists household_invites_household_idx
  on public.household_invites (household_id, created_at desc);
create index if not exists expenses_household_date_idx
  on public.expenses (household_id, expense_date desc, created_at desc);
create index if not exists expenses_household_creator_idx
  on public.expenses (household_id, created_by, expense_date desc);
create index if not exists household_finances_household_date_idx
  on public.household_finances (household_id, record_date desc, created_at desc);
create index if not exists household_finances_member_date_idx
  on public.household_finances (household_id, member_id, record_date desc);
create index if not exists household_loans_household_member_idx
  on public.household_loans (household_id, member_id, active);
create index if not exists household_loan_payments_household_period_idx
  on public.household_loan_payments (household_id, period_month desc);
create index if not exists household_loan_payments_loan_period_idx
  on public.household_loan_payments (loan_id, period_month desc);

create or replace function public.is_household_member(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.household_members
    where household_id = p_household_id
      and user_id = (select auth.uid())
  );
$$;

create or replace function public.is_household_admin(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.household_members
    where household_id = p_household_id
      and user_id = (select auth.uid())
      and role = 'admin'
  );
$$;

create or replace function public.create_household(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_household_id uuid;
  v_name text := trim(p_name);
begin
  if v_user_id is null then
    raise exception 'Sign in before creating a household';
  end if;
  if length(v_name) < 2 or length(v_name) > 60 then
    raise exception 'Household name must be between 2 and 60 characters';
  end if;
  if exists (select 1 from public.household_members where user_id = v_user_id) then
    raise exception 'Your account already belongs to a household';
  end if;

  select email into v_email from auth.users where id = v_user_id;
  insert into public.households (name, created_by)
  values (v_name, v_user_id)
  returning id into v_household_id;

  insert into public.household_members (household_id, user_id, email, role)
  values (v_household_id, v_user_id, coalesce(v_email, ''), 'admin');

  update public.expenses
  set household_id = v_household_id,
      created_by = coalesce(created_by, v_user_id)
  where household_id is null
    and (created_by = v_user_id or user_id = v_user_id);

  return v_household_id;
end;
$$;

create or replace function public.create_household_invite(p_household_id uuid, p_invited_email text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text := lower(trim(p_invited_email));
  v_invite_id uuid;
begin
  if v_user_id is null or not public.is_household_admin(p_household_id) then
    raise exception 'Only a household admin can invite members';
  end if;
  if v_email = '' or position('@' in v_email) < 2 then
    raise exception 'Enter a valid email address';
  end if;
  if exists (
    select 1 from public.household_members
    where household_id = p_household_id and lower(email) = v_email
  ) then
    raise exception 'That email is already a household member';
  end if;

  insert into public.household_invites (household_id, email, invited_by)
  values (p_household_id, v_email, v_user_id)
  returning id into v_invite_id;
  return v_invite_id;
end;
$$;

create or replace function public.accept_household_invite(p_invite_code uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_invite public.household_invites%rowtype;
begin
  if v_user_id is null then
    raise exception 'Sign in before accepting an invitation';
  end if;
  select lower(email) into v_email from auth.users where id = v_user_id;
  select * into v_invite
  from public.household_invites
  where id = p_invite_code
    and accepted_at is null
    and expires_at > now()
  for update;

  if not found then
    raise exception 'Invitation code is invalid or expired';
  end if;
  if lower(v_invite.email) <> coalesce(v_email, '') then
    raise exception 'Sign in with the email address this invitation was sent to';
  end if;
  if exists (select 1 from public.household_members where user_id = v_user_id) then
    raise exception 'Your account already belongs to a household';
  end if;

  insert into public.household_members (household_id, user_id, email, role)
  values (v_invite.household_id, v_user_id, v_email, 'member');
  update public.household_invites set accepted_at = now() where id = v_invite.id;
  return v_invite.household_id;
end;
$$;

create or replace function public.keep_expense_creator()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if old.created_by is not null and new.created_by is distinct from old.created_by then
    raise exception 'Expense creator cannot be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists expenses_keep_creator on public.expenses;
create trigger expenses_keep_creator
before update on public.expenses
for each row execute function public.keep_expense_creator();

create or replace function public.keep_finance_creator()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if old.created_by is distinct from new.created_by then
    raise exception 'Finance record creator cannot be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists household_finances_keep_creator on public.household_finances;
create trigger household_finances_keep_creator
before update on public.household_finances
for each row execute function public.keep_finance_creator();

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invites enable row level security;
alter table public.expenses enable row level security;
alter table public.household_finances enable row level security;
alter table public.household_loans enable row level security;
alter table public.household_loan_payments enable row level security;

drop policy if exists "Users manage their own expenses" on public.expenses;
drop policy if exists "Household members read expenses" on public.expenses;
drop policy if exists "Household members add expenses" on public.expenses;
drop policy if exists "Household members edit expenses" on public.expenses;
drop policy if exists "Household members delete expenses" on public.expenses;
create policy "Household members read expenses"
  on public.expenses for select to authenticated
  using (public.is_household_member(household_id));
create policy "Household members add expenses"
  on public.expenses for insert to authenticated
  with check (
    public.is_household_member(household_id)
    and created_by = (select auth.uid())
    and exists (
      select 1 from public.household_members target
      where target.household_id = expenses.household_id
        and target.user_id = expenses.member_id
    )
    and (member_id = (select auth.uid()) or public.is_household_admin(household_id))
  );
create policy "Household members edit expenses"
  on public.expenses for update to authenticated
  using (
    public.is_household_admin(household_id)
    or member_id = (select auth.uid())
  )
  with check (
    public.is_household_member(household_id)
    and (
      member_id is null
      or exists (
        select 1 from public.household_members target
        where target.household_id = expenses.household_id
          and target.user_id = expenses.member_id
      )
    )
    and (member_id = (select auth.uid()) or public.is_household_admin(household_id))
  );
create policy "Household members delete expenses"
  on public.expenses for delete to authenticated
  using (
    public.is_household_admin(household_id)
    or member_id = (select auth.uid())
  );

drop policy if exists "Household members read finance records" on public.household_finances;
drop policy if exists "Household members add finance records" on public.household_finances;
drop policy if exists "Household owners update finance records" on public.household_finances;
drop policy if exists "Household owners delete finance records" on public.household_finances;
create policy "Household members read finance records"
  on public.household_finances for select to authenticated
  using (public.is_household_member(household_id));
create policy "Household members add finance records"
  on public.household_finances for insert to authenticated
  with check (
    public.is_household_member(household_id)
    and created_by = (select auth.uid())
    and exists (
      select 1 from public.household_members target
      where target.household_id = household_finances.household_id
        and target.user_id = household_finances.member_id
    )
    and (member_id = (select auth.uid()) or public.is_household_admin(household_id))
  );
create policy "Household owners update finance records"
  on public.household_finances for update to authenticated
  using (public.is_household_admin(household_id))
  with check (
    public.is_household_admin(household_id)
    and exists (
      select 1 from public.household_members target
      where target.household_id = household_finances.household_id
        and target.user_id = household_finances.member_id
    )
  );
create policy "Household owners delete finance records"
  on public.household_finances for delete to authenticated
  using (public.is_household_admin(household_id));

drop policy if exists "Household members read loans" on public.household_loans;
drop policy if exists "Household members add loans" on public.household_loans;
create policy "Household members read loans"
  on public.household_loans for select to authenticated
  using (public.is_household_member(household_id));
create policy "Household members add loans"
  on public.household_loans for insert to authenticated
  with check (
    public.is_household_member(household_id)
    and created_by = (select auth.uid())
    and exists (
      select 1 from public.household_members target
      where target.household_id = household_loans.household_id
        and target.user_id = household_loans.member_id
    )
    and (member_id = (select auth.uid()) or public.is_household_admin(household_id))
  );

drop policy if exists "Household members read loan payments" on public.household_loan_payments;
drop policy if exists "Household members add loan payments" on public.household_loan_payments;
create policy "Household members read loan payments"
  on public.household_loan_payments for select to authenticated
  using (public.is_household_member(household_id));
create policy "Household members add loan payments"
  on public.household_loan_payments for insert to authenticated
  with check (
    public.is_household_member(household_id)
    and created_by = (select auth.uid())
    and exists (
      select 1
      from public.household_loans loan
      join public.household_members target
        on target.household_id = loan.household_id
       and target.user_id = loan.member_id
      where loan.id = household_loan_payments.loan_id
        and loan.household_id = household_loan_payments.household_id
        and loan.member_id = household_loan_payments.member_id
        and loan.active
    )
    and (member_id = (select auth.uid()) or public.is_household_admin(household_id))
  );

drop policy if exists "Members read their household" on public.households;
drop policy if exists "Admins update their household" on public.households;
create policy "Members read their household"
  on public.households for select to authenticated
  using (public.is_household_member(id));
create policy "Admins update their household"
  on public.households for update to authenticated
  using (public.is_household_admin(id))
  with check (public.is_household_admin(id));

drop policy if exists "Members read household membership" on public.household_members;
create policy "Members read household membership"
  on public.household_members for select to authenticated
  using (public.is_household_member(household_id));

drop policy if exists "Admins read household invitations" on public.household_invites;
create policy "Admins read household invitations"
  on public.household_invites for select to authenticated
  using (public.is_household_admin(household_id));

revoke all on function public.is_household_member(uuid) from public, anon;
revoke all on function public.is_household_admin(uuid) from public, anon;
revoke all on function public.create_household(text) from public, anon;
revoke all on function public.create_household_invite(uuid, text) from public, anon;
revoke all on function public.accept_household_invite(uuid) from public, anon;
grant execute on function public.is_household_member(uuid) to authenticated;
grant execute on function public.is_household_admin(uuid) to authenticated;
grant execute on function public.create_household(text) to authenticated;
grant execute on function public.create_household_invite(uuid, text) to authenticated;
grant execute on function public.accept_household_invite(uuid) to authenticated;

grant select, insert, update, delete on public.expenses to authenticated;
grant select, insert, update, delete on public.household_finances to authenticated;
grant select, insert on public.household_loans, public.household_loan_payments to authenticated;
grant select on public.households, public.household_members, public.household_invites to authenticated;