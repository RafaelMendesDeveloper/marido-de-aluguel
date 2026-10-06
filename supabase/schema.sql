-- ============================================================
-- Orça! — schema do Supabase
-- Rode este arquivo inteiro no SQL Editor de um projeto novo.
-- Cada usuário só enxerga as próprias linhas (Row Level Security).
-- ============================================================

-- ============================================================
-- PERFIS (nome do usuário; e-mail/senha ficam em auth.users)
-- ============================================================
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  nome       text not null,
  criado_em  timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, nome)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data->>'nome'), ''), split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- CLIENTES
-- ============================================================
create table public.clientes (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome        text not null check (length(trim(nome)) > 0),
  telefone    text,              -- só dígitos
  endereco    text,
  criado_em   timestamptz not null default now(),
  unique (id, usuario_id)        -- alvo das FKs compostas
);
create index clientes_usuario_nome_idx on public.clientes (usuario_id, nome);
create index clientes_usuario_tel_idx  on public.clientes (usuario_id, telefone);

-- ============================================================
-- AGENDAMENTOS
-- ============================================================
create table public.agendamentos (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  cliente_id  uuid not null,
  data        date not null,
  hora        time not null,
  descricao   text not null check (length(trim(descricao)) > 0),
  status      text not null default 'agendado'
              check (status in ('agendado', 'concluido', 'cancelado')),
  criado_em   timestamptz not null default now(),
  unique (id, usuario_id),
  foreign key (cliente_id, usuario_id)
    references public.clientes (id, usuario_id) on delete cascade
);
create index agendamentos_usuario_status_data_idx
  on public.agendamentos (usuario_id, status, data, hora);
create index agendamentos_cliente_idx on public.agendamentos (cliente_id);

-- ============================================================
-- SERVIÇOS
-- ============================================================
create table public.servicos (
  id              uuid primary key default gen_random_uuid(),
  usuario_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  cliente_id      uuid not null,
  agendamento_id  uuid,          -- agendamento que originou o serviço (opcional)
  data            date not null default current_date,
  valor           numeric(10,2) check (valor is null or valor >= 0), -- nullable por causa do histórico
  pago            boolean not null default false,
  observacao      text,
  criado_em       timestamptz not null default now(),
  foreign key (cliente_id, usuario_id)
    references public.clientes (id, usuario_id) on delete cascade,
  foreign key (agendamento_id, usuario_id)
    references public.agendamentos (id, usuario_id) on delete set null (agendamento_id)
);
create index servicos_usuario_data_idx on public.servicos (usuario_id, data desc, criado_em desc);
create index servicos_cliente_idx      on public.servicos (cliente_id, data desc);
create index servicos_agendamento_idx  on public.servicos (agendamento_id);

-- Registrar um serviço a partir de um agendamento conclui o agendamento
-- na mesma transação (substitui o insert + update separados do app antigo).
create or replace function public.concluir_agendamento_do_servico()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.agendamentos
     set status = 'concluido'
   where id = new.agendamento_id
     and usuario_id = new.usuario_id
     and status = 'agendado';
  return new;
end;
$$;

create trigger servico_conclui_agendamento
  after insert on public.servicos
  for each row
  when (new.agendamento_id is not null)
  execute function public.concluir_agendamento_do_servico();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles     enable row level security;
alter table public.clientes     enable row level security;
alter table public.agendamentos enable row level security;
alter table public.servicos     enable row level security;

create policy "perfil: dono lê"     on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy "perfil: dono altera" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "clientes: dono" on public.clientes for all to authenticated
  using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));

create policy "agendamentos: dono" on public.agendamentos for all to authenticated
  using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));

create policy "servicos: dono" on public.servicos for all to authenticated
  using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));
