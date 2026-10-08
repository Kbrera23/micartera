create table if not exists public.transfer_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  patron_concepto text not null,
  banco_destino text not null,
  etiqueta text,
  activa boolean not null default true,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.transfer_rules to authenticated;
grant all on public.transfer_rules to service_role;

alter table public.transfer_rules enable row level security;

create policy "transfer_rules_select_own" on public.transfer_rules for select to authenticated using (auth.uid() = user_id);
create policy "transfer_rules_insert_own" on public.transfer_rules for insert to authenticated with check (auth.uid() = user_id);
create policy "transfer_rules_update_own" on public.transfer_rules for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "transfer_rules_delete_own" on public.transfer_rules for delete to authenticated using (auth.uid() = user_id);