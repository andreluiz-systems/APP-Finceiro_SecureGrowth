-- =====================================================================
-- Secure Growth - schema inicial
-- Cole este arquivo inteiro no Supabase: SQL Editor > New query > Run.
-- Rode uma única vez, num projeto novo (rodar de novo dá erro de "já existe").
-- =====================================================================

-- ---------- Funções auxiliares ----------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Formata valor em reais para as notificações: 1234.5 -> "R$ 1.234,50"
create or replace function public.format_brl(value numeric)
returns text
language sql
immutable
set search_path = ''
as $$
  select 'R$ ' || translate(to_char(value, 'FM999,999,999,990.00'), ',.', '.,');
$$;

-- ---------- Perfis (1 por usuário do Supabase Auth) ----------

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '',
  email       text,
  phone       text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Cria o perfil automaticamente quando alguém se cadastra
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      ''
    ),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Categorias ----------
-- user_id nulo = categoria padrão do app (todo mundo vê). Preenchido = categoria do usuário.
-- icon = nome do ícone da família MaterialCommunityIcons.

create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users (id) on delete cascade,
  name        text not null check (char_length(trim(name)) > 0),
  icon        text not null default 'tag-outline',
  kind        text not null check (kind in ('income', 'expense', 'both')),
  created_at  timestamptz not null default now()
);

create index categories_user_idx on public.categories (user_id);

-- ---------- Transações ----------

create table public.transactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type         text not null check (type in ('income', 'expense')),
  amount       numeric(12, 2) not null check (amount > 0),
  description  text not null check (char_length(trim(description)) > 0),
  category_id  uuid references public.categories (id) on delete set null,
  occurred_at  timestamptz not null default now(),
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index transactions_user_date_idx on public.transactions (user_id, occurred_at desc);

create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

-- ---------- Lembretes de contas ----------
-- Cada mês é uma linha. series_id liga as ocorrências do mesmo lembrete (histórico).

create table public.reminders (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  series_id       uuid not null default gen_random_uuid(),
  name            text not null check (char_length(trim(name)) > 0),
  amount          numeric(12, 2) not null check (amount > 0),
  category_id     uuid references public.categories (id) on delete set null,
  due_date        date not null,
  repeat_monthly  boolean not null default false,
  notify_before   boolean not null default true,
  status          text not null default 'pending' check (status in ('pending', 'paid')),
  paid_at         timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index reminders_user_due_idx on public.reminders (user_id, due_date);
create index reminders_series_idx on public.reminders (series_id);

create trigger reminders_set_updated_at
  before update on public.reminders
  for each row execute function public.set_updated_at();

-- ---------- Metas ----------

create table public.goals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name           text not null check (char_length(trim(name)) > 0),
  target_amount  numeric(12, 2) not null check (target_amount > 0),
  saved_amount   numeric(12, 2) not null default 0 check (saved_amount >= 0),
  deadline       date,
  icon           text not null default 'flag-outline',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index goals_user_idx on public.goals (user_id);

create trigger goals_set_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

-- ---------- Notificações ----------

create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind        text not null default 'info' check (kind in ('info', 'transaction', 'reminder', 'goal', 'security')),
  title       text not null,
  body        text not null default '',
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

create index notifications_user_date_idx on public.notifications (user_id, created_at desc);

-- ---------- Regras automáticas (triggers) ----------

-- Nova transação -> notificação
create or replace function public.notify_transaction()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  insert into public.notifications (user_id, kind, title, body)
  values (
    new.user_id,
    'transaction',
    case new.type when 'income' then 'Receita registrada' else 'Despesa registrada' end,
    new.description || ' · ' || public.format_brl(new.amount)
  );
  return new;
end;
$$;

create trigger transactions_notify
  after insert on public.transactions
  for each row execute function public.notify_transaction();

-- Lembrete: preenche/limpa paid_at conforme o status
create or replace function public.reminder_set_paid_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'paid' and old.status <> 'paid' then
    new.paid_at = coalesce(new.paid_at, now());
  elsif new.status = 'pending' then
    new.paid_at = null;
  end if;
  return new;
end;
$$;

create trigger reminders_paid_at
  before update of status on public.reminders
  for each row execute function public.reminder_set_paid_at();

-- Lembrete: ao marcar como pago -> avisa e, se repete todo mês, cria o do mês seguinte.
-- Ao desfazer o pagamento, remove o do mês seguinte (se ainda estiver pendente).
create or replace function public.reminder_after_status_change()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  next_due date := (new.due_date + interval '1 month')::date;
begin
  if new.status = 'paid' and old.status = 'pending' then
    insert into public.notifications (user_id, kind, title, body)
    values (new.user_id, 'reminder', 'Conta paga', new.name || ' · ' || public.format_brl(new.amount));

    if new.repeat_monthly and not exists (
      select 1 from public.reminders
      where series_id = new.series_id and due_date = next_due
    ) then
      insert into public.reminders
        (user_id, series_id, name, amount, category_id, due_date, repeat_monthly, notify_before)
      values
        (new.user_id, new.series_id, new.name, new.amount, new.category_id, next_due, true, new.notify_before);
    end if;

  elsif new.status = 'pending' and old.status = 'paid' and new.repeat_monthly then
    delete from public.reminders
    where series_id = new.series_id
      and due_date = next_due
      and status = 'pending'
      and id <> new.id;
  end if;
  return new;
end;
$$;

create trigger reminders_status_change
  after update of status on public.reminders
  for each row
  when (old.status is distinct from new.status)
  execute function public.reminder_after_status_change();

-- Meta: ao atingir o valor alvo -> notificação
create or replace function public.notify_goal_reached()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.saved_amount >= new.target_amount and old.saved_amount < old.target_amount then
    insert into public.notifications (user_id, kind, title, body)
    values (new.user_id, 'goal', 'Meta alcançada!', 'Parabéns! Você atingiu a meta "' || new.name || '".');
  end if;
  return new;
end;
$$;

create trigger goals_reached
  after update of saved_amount on public.goals
  for each row execute function public.notify_goal_reached();

-- ---------- Segurança: Row Level Security ----------
-- Cada usuário só enxerga e altera os próprios dados.

alter table public.profiles       enable row level security;
alter table public.categories     enable row level security;
alter table public.transactions   enable row level security;
alter table public.reminders      enable row level security;
alter table public.goals          enable row level security;
alter table public.notifications  enable row level security;

-- profiles (o perfil é criado pelo trigger, então não há policy de insert)
create policy "profiles: ver o proprio"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles: editar o proprio"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- categories: todos veem as padrão (user_id nulo) e as próprias
create policy "categories: ver padrao e proprias"
  on public.categories for select to authenticated
  using (user_id is null or user_id = (select auth.uid()));

create policy "categories: criar proprias"
  on public.categories for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "categories: editar proprias"
  on public.categories for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "categories: apagar proprias"
  on public.categories for delete to authenticated
  using (user_id = (select auth.uid()));

-- transactions
create policy "transactions: ver proprias"
  on public.transactions for select to authenticated
  using (user_id = (select auth.uid()));

create policy "transactions: criar proprias"
  on public.transactions for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "transactions: editar proprias"
  on public.transactions for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "transactions: apagar proprias"
  on public.transactions for delete to authenticated
  using (user_id = (select auth.uid()));

-- reminders
create policy "reminders: ver proprios"
  on public.reminders for select to authenticated
  using (user_id = (select auth.uid()));

create policy "reminders: criar proprios"
  on public.reminders for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "reminders: editar proprios"
  on public.reminders for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "reminders: apagar proprios"
  on public.reminders for delete to authenticated
  using (user_id = (select auth.uid()));

-- goals
create policy "goals: ver proprias"
  on public.goals for select to authenticated
  using (user_id = (select auth.uid()));

create policy "goals: criar proprias"
  on public.goals for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "goals: editar proprias"
  on public.goals for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "goals: apagar proprias"
  on public.goals for delete to authenticated
  using (user_id = (select auth.uid()));

-- notifications
create policy "notifications: ver proprias"
  on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));

create policy "notifications: criar proprias"
  on public.notifications for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "notifications: editar proprias"
  on public.notifications for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "notifications: apagar proprias"
  on public.notifications for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------- Permissões de acesso pela API ----------
-- O projeto foi criado com "expose new tables" desligado, então liberamos só o necessário.
-- Visitantes não logados (anon) não têm acesso a nada.

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
grant select, insert, update, delete on public.reminders to authenticated;
grant select, insert, update, delete on public.goals to authenticated;
grant select, insert, update, delete on public.notifications to authenticated;

-- ---------- Categorias padrão ----------

insert into public.categories (user_id, name, icon, kind) values
  -- despesas
  (null, 'Alimentação',   'silverware-fork-knife',     'expense'),
  (null, 'Mercado',       'cart-outline',              'expense'),
  (null, 'Compras',       'shopping-outline',          'expense'),
  (null, 'Transporte',    'car-outline',               'expense'),
  (null, 'Combustível',   'gas-station-outline',       'expense'),
  (null, 'Moradia',       'home-outline',              'expense'),
  (null, 'Contas fixas',  'file-document-outline',     'expense'),
  (null, 'Energia',       'lightning-bolt-outline',    'expense'),
  (null, 'Internet',      'wifi',                      'expense'),
  (null, 'Água',          'water-outline',             'expense'),
  (null, 'Saúde',         'heart-pulse',               'expense'),
  (null, 'Lazer',         'gamepad-variant-outline',   'expense'),
  (null, 'Viagem',        'airplane',                  'expense'),
  (null, 'Educação',      'school-outline',            'expense'),
  (null, 'Assinaturas',   'calendar-sync-outline',     'expense'),
  (null, 'Cartão',        'credit-card-outline',       'expense'),
  (null, 'Outro',         'dots-horizontal',           'expense'),
  -- receitas
  (null, 'Salário',       'briefcase-outline',         'income'),
  (null, 'Horas extras',  'clock-outline',             'income'),
  (null, 'Freelance',     'laptop',                    'income'),
  (null, 'Investimentos', 'trending-up',               'income'),
  (null, 'Vendas',        'storefront-outline',        'income'),
  (null, 'Presente',      'gift-outline',              'income'),
  (null, 'Extra',         'cash-plus',                 'income'),
  (null, 'Outro',         'dots-horizontal',           'income');

-- ---------- Foto de perfil (Storage) ----------
-- Bucket público para leitura; cada usuário só grava dentro da própria pasta (<user_id>/avatar.jpg).

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars: enviar na propria pasta"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "avatars: ver na propria pasta"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "avatars: trocar na propria pasta"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "avatars: apagar na propria pasta"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
