-- DataSport Univalle · esquema relacional
-- Ejecutar completo en Supabase → SQL Editor (o con el MCP de Supabase como migración).
-- Es idempotente en lo posible: se puede volver a correr sin borrar datos.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.deporte as enum ('futbol11', 'futbol_sala', 'baloncesto', 'voleibol', 'balonmano');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.categoria as enum ('femenino', 'masculino');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.condicion as enum ('local', 'visitante', 'neutral');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

-- Profesores autorizados. La coordinación crea la invitación y entrega la llave;
-- solo un correo invitado, con su llave, puede activar una cuenta.
create table if not exists public.invitaciones (
  email       text primary key check (email = lower(btrim(email)) and position('@' in email) > 1),
  nombre      text not null check (length(btrim(nombre)) > 0),
  llave       text not null default upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 4) || '-' || substr(encode(gen_random_bytes(4), 'hex'), 1, 4)),
  es_admin    boolean not null default false,
  creada_por  uuid references auth.users (id) on delete set null,
  creada_en   timestamptz not null default now(),
  activada_en timestamptz
);

create table if not exists public.perfiles (
  id        uuid primary key references auth.users (id) on delete cascade,
  email     text not null unique,
  nombre    text not null,
  es_admin  boolean not null default false,
  creado_en timestamptz not null default now()
);

create table if not exists public.equipos (
  id          uuid primary key default gen_random_uuid(),
  profesor_id uuid not null default auth.uid() references public.perfiles (id) on delete cascade,
  nombre      text not null check (length(btrim(nombre)) > 0),
  deporte     public.deporte not null,
  categoria   public.categoria not null,
  temporada   text not null default to_char(now(), 'YYYY'),
  creado_en   timestamptz not null default now()
);
create index if not exists equipos_profesor_idx on public.equipos (profesor_id);

create table if not exists public.jugadores (
  id        uuid primary key default gen_random_uuid(),
  equipo_id uuid not null references public.equipos (id) on delete cascade,
  nombre    text not null check (length(btrim(nombre)) > 0),
  dorsal    smallint check (dorsal between 0 and 99),
  posicion  text,
  activo    boolean not null default true,
  creado_en timestamptz not null default now()
);
create index if not exists jugadores_equipo_idx on public.jugadores (equipo_id);

create table if not exists public.partidos (
  id              uuid primary key default gen_random_uuid(),
  equipo_id       uuid not null references public.equipos (id) on delete cascade,
  fecha           date not null,
  rival           text not null check (length(btrim(rival)) > 0),
  condicion       public.condicion not null default 'local',
  competicion     text,
  -- Goles o puntos. En voleibol: sets ganados y perdidos.
  marcador_favor  smallint not null check (marcador_favor >= 0),
  marcador_contra smallint not null check (marcador_contra >= 0),
  -- Solo voleibol: puntos de cada set, p. ej. [[25,20],[22,25],[25,18]]
  parciales       jsonb check (parciales is null or jsonb_typeof(parciales) = 'array'),
  notas           text,
  creado_en       timestamptz not null default now()
);
create index if not exists partidos_equipo_fecha_idx on public.partidos (equipo_id, fecha);

-- Estadística por jugador y partido, en formato largo: una fila por métrica.
-- El catálogo de métricas de cada deporte vive en la app (assets/js/sports.js).
create table if not exists public.estadisticas (
  partido_id uuid not null references public.partidos (id) on delete cascade,
  jugador_id uuid not null references public.jugadores (id) on delete cascade,
  metrica    text not null check (metrica ~ '^[a-z0-9_]{1,40}$'),
  valor      numeric not null check (valor >= 0 and valor <= 1000),
  primary key (partido_id, jugador_id, metrica)
);
create index if not exists estadisticas_jugador_idx on public.estadisticas (jugador_id);

-- ---------------------------------------------------------------------------
-- Funciones auxiliares (security definer para no recursar en RLS)
-- ---------------------------------------------------------------------------
create or replace function public.es_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select es_admin from public.perfiles where id = auth.uid()), false);
$$;

create or replace function public.es_dueno_equipo(p_equipo uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.equipos where id = p_equipo and profesor_id = auth.uid());
$$;

create or replace function public.puede_ver_equipo(p_equipo uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.es_dueno_equipo(p_equipo) or public.es_admin();
$$;

-- Partido y jugador deben ser del mismo equipo, y ese equipo del profesor.
create or replace function public.misma_plantilla(p_partido uuid, p_jugador uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.partidos p
    join public.jugadores j on j.equipo_id = p.equipo_id
    join public.equipos e on e.id = p.equipo_id
    where p.id = p_partido and j.id = p_jugador and e.profesor_id = auth.uid()
  );
$$;

create or replace function public.equipo_de_partido(p_partido uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select equipo_id from public.partidos where id = p_partido;
$$;

-- ---------------------------------------------------------------------------
-- Registro controlado: solo correos invitados y con su llave
-- ---------------------------------------------------------------------------
create or replace function public.validar_registro()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  inv public.invitaciones;
begin
  select * into inv from public.invitaciones where email = lower(new.email);
  if inv.email is null
     or inv.activada_en is not null
     or upper(btrim(coalesce(new.raw_user_meta_data ->> 'llave', ''))) <> inv.llave then
    raise exception 'Registro no autorizado: correo o llave de acceso no válidos';
  end if;
  return new;
end;
$$;

create or replace function public.crear_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  inv public.invitaciones;
begin
  select * into inv from public.invitaciones where email = lower(new.email);
  insert into public.perfiles (id, email, nombre, es_admin)
  values (new.id, lower(new.email), inv.nombre, inv.es_admin)
  on conflict (id) do nothing;
  update public.invitaciones set activada_en = now() where email = lower(new.email);
  return new;
end;
$$;

drop trigger if exists datasport_validar_registro on auth.users;
create trigger datasport_validar_registro
  before insert on auth.users
  for each row execute function public.validar_registro();

drop trigger if exists datasport_crear_perfil on auth.users;
create trigger datasport_crear_perfil
  after insert on auth.users
  for each row execute function public.crear_perfil();

-- ---------------------------------------------------------------------------
-- Seguridad por filas (RLS)
-- ---------------------------------------------------------------------------
alter table public.invitaciones enable row level security;
alter table public.perfiles     enable row level security;
alter table public.equipos      enable row level security;
alter table public.jugadores    enable row level security;
alter table public.partidos     enable row level security;
alter table public.estadisticas enable row level security;

-- invitaciones: solo la coordinación (admin)
drop policy if exists invitaciones_admin on public.invitaciones;
create policy invitaciones_admin on public.invitaciones
  for all to authenticated
  using (public.es_admin())
  with check (public.es_admin());

-- perfiles: cada quien ve el suyo; el admin ve todos
drop policy if exists perfiles_select on public.perfiles;
create policy perfiles_select on public.perfiles
  for select to authenticated
  using (id = auth.uid() or public.es_admin());

drop policy if exists perfiles_update on public.perfiles;
create policy perfiles_update on public.perfiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and es_admin = public.es_admin());

-- equipos
drop policy if exists equipos_select on public.equipos;
create policy equipos_select on public.equipos
  for select to authenticated
  using (profesor_id = auth.uid() or public.es_admin());

drop policy if exists equipos_insert on public.equipos;
create policy equipos_insert on public.equipos
  for insert to authenticated
  with check (profesor_id = auth.uid());

drop policy if exists equipos_update on public.equipos;
create policy equipos_update on public.equipos
  for update to authenticated
  using (profesor_id = auth.uid())
  with check (profesor_id = auth.uid());

drop policy if exists equipos_delete on public.equipos;
create policy equipos_delete on public.equipos
  for delete to authenticated
  using (profesor_id = auth.uid());

-- jugadores
drop policy if exists jugadores_select on public.jugadores;
create policy jugadores_select on public.jugadores
  for select to authenticated using (public.puede_ver_equipo(equipo_id));

drop policy if exists jugadores_write on public.jugadores;
create policy jugadores_write on public.jugadores
  for all to authenticated
  using (public.es_dueno_equipo(equipo_id))
  with check (public.es_dueno_equipo(equipo_id));

-- partidos
drop policy if exists partidos_select on public.partidos;
create policy partidos_select on public.partidos
  for select to authenticated using (public.puede_ver_equipo(equipo_id));

drop policy if exists partidos_write on public.partidos;
create policy partidos_write on public.partidos
  for all to authenticated
  using (public.es_dueno_equipo(equipo_id))
  with check (public.es_dueno_equipo(equipo_id));

-- estadisticas
drop policy if exists estadisticas_select on public.estadisticas;
create policy estadisticas_select on public.estadisticas
  for select to authenticated using (public.puede_ver_equipo(public.equipo_de_partido(partido_id)));

drop policy if exists estadisticas_write on public.estadisticas;
create policy estadisticas_write on public.estadisticas
  for all to authenticated
  using (public.misma_plantilla(partido_id, jugador_id))
  with check (public.misma_plantilla(partido_id, jugador_id));

-- Permisos de tabla para el rol autenticado (RLS decide las filas)
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.invitaciones, public.equipos, public.jugadores, public.partidos, public.estadisticas to authenticated;
grant select, update on public.perfiles to authenticated;
revoke all on public.invitaciones, public.perfiles, public.equipos, public.jugadores, public.partidos, public.estadisticas from anon;

-- ---------------------------------------------------------------------------
-- Guardar un partido completo en una sola transacción
-- p_estadisticas: [{"jugador_id": "...", "metrica": "goles", "valor": 2}, ...]
-- ---------------------------------------------------------------------------
create or replace function public.guardar_partido(
  p_id uuid,
  p_equipo uuid,
  p_fecha date,
  p_rival text,
  p_condicion public.condicion,
  p_competicion text,
  p_favor smallint,
  p_contra smallint,
  p_parciales jsonb,
  p_notas text,
  p_estadisticas jsonb
) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  v_id uuid := coalesce(p_id, gen_random_uuid());
begin
  if not public.es_dueno_equipo(p_equipo) then
    raise exception 'No puedes registrar partidos en este equipo';
  end if;
  if p_id is not null and exists (select 1 from public.partidos where id = p_id and equipo_id <> p_equipo) then
    raise exception 'El partido no pertenece a este equipo';
  end if;

  insert into public.partidos (id, equipo_id, fecha, rival, condicion, competicion, marcador_favor, marcador_contra, parciales, notas)
  values (v_id, p_equipo, p_fecha, btrim(p_rival), p_condicion, nullif(btrim(p_competicion), ''), p_favor, p_contra, p_parciales, nullif(btrim(p_notas), ''))
  on conflict (id) do update set
    fecha = excluded.fecha, rival = excluded.rival, condicion = excluded.condicion,
    competicion = excluded.competicion, marcador_favor = excluded.marcador_favor,
    marcador_contra = excluded.marcador_contra, parciales = excluded.parciales, notas = excluded.notas;

  delete from public.estadisticas where partido_id = v_id;

  insert into public.estadisticas (partido_id, jugador_id, metrica, valor)
  select v_id, (e ->> 'jugador_id')::uuid, e ->> 'metrica', (e ->> 'valor')::numeric
  from jsonb_array_elements(coalesce(p_estadisticas, '[]'::jsonb)) as e
  where (e ->> 'valor')::numeric > 0;

  return v_id;
end;
$$;

grant execute on function public.guardar_partido(uuid, uuid, date, text, public.condicion, text, smallint, smallint, jsonb, text, jsonb) to authenticated;
revoke execute on function public.guardar_partido(uuid, uuid, date, text, public.condicion, text, smallint, smallint, jsonb, text, jsonb) from anon;
