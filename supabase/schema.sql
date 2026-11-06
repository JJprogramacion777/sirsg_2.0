-- =====================================================================
-- SIRSG 2.0 — Esquema de base de datos para Supabase
-- Ejecutar completo en: Supabase > SQL Editor > New query
-- =====================================================================

-- ---------------------------------------------------------------------
-- Administradores. Solo los usuarios de esta tabla pueden editar.
-- ---------------------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------
-- RF-01, RF-14, RF-15: secciones con versiones (borrador / publicado)
-- ---------------------------------------------------------------------
create table if not exists public.section_versions (
  id uuid primary key default gen_random_uuid(),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 1 and 150),
  body text not null default '',
  image_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users (id) on delete set null
);
create index if not exists section_versions_slug_idx on public.section_versions (slug, status, created_at desc);
alter table public.section_versions enable row level security;

drop policy if exists "publico lee publicadas" on public.section_versions;
create policy "publico lee publicadas" on public.section_versions
  for select using (status = 'published' or public.is_admin());
drop policy if exists "admin escribe secciones" on public.section_versions;
create policy "admin escribe secciones" on public.section_versions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- RF-03, RF-17, RF-18, RF-19: eventos
-- ---------------------------------------------------------------------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 150),
  description text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location text,
  link text,
  created_at timestamptz not null default now(),
  constraint events_rango_valido check (ends_at > starts_at),
  constraint events_link_https check (
    link is null or link ~* '^https://([a-z0-9-]+\.)+[a-z]{2,}(:[0-9]{2,5})?(/[^[:space:]<>"'']*)?$'
  ),
  constraint events_lugar_o_link check (location is not null or link is not null)
);
create index if not exists events_dates_idx on public.events (ends_at, starts_at);
alter table public.events enable row level security;

drop policy if exists "publico lee eventos" on public.events;
create policy "publico lee eventos" on public.events for select using (true);
drop policy if exists "admin escribe eventos" on public.events;
create policy "admin escribe eventos" on public.events
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- RF-06, RF-20: documentos (metadatos; el archivo vive en Storage)
-- ---------------------------------------------------------------------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  path text not null unique,
  size_bytes bigint not null check (size_bytes <= 10 * 1024 * 1024),
  created_at timestamptz not null default now()
);
alter table public.documents enable row level security;

drop policy if exists "publico lee documentos" on public.documents;
create policy "publico lee documentos" on public.documents for select using (true);
drop policy if exists "admin escribe documentos" on public.documents;
create policy "admin escribe documentos" on public.documents
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- RF-07, RF-08: mensajes de contacto
-- ---------------------------------------------------------------------
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  email text not null check (email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$' and char_length(email) <= 150),
  subject text not null check (char_length(subject) between 3 and 150),
  message text not null check (char_length(message) between 10 and 2000),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Datos de inscripción (las opciones coinciden con src/lib/registration.ts).
alter table public.contact_messages add column if not exists last_name text not null default '';
alter table public.contact_messages add column if not exists document_type text not null default 'CC';
alter table public.contact_messages add column if not exists document_number text not null default '';
alter table public.contact_messages add column if not exists career text not null default '';
alter table public.contact_messages add column if not exists semester int not null default 1;
alter table public.contact_messages add column if not exists campus text not null default 'Sede principal';
alter table public.contact_messages add column if not exists age int not null default 18;
alter table public.contact_messages add column if not exists status text not null default 'nuevo';
alter table public.contact_messages add column if not exists notes text not null default '';

alter table public.contact_messages drop constraint if exists contact_inscripcion_valida;
alter table public.contact_messages add constraint contact_inscripcion_valida check (
  char_length(last_name) <= 100
  and document_type in ('CC', 'TI', 'CE', 'PA', 'PPT')
  and char_length(career) <= 120
  and semester between 1 and 10
  and campus in ('Sede principal', 'Sede sur', 'Otra sede')
  and age between 14 and 80
  and status in ('nuevo', 'contactado', 'aceptado', 'rechazado')
  and char_length(notes) <= 2000
);

-- Número de documento: 6 a 10 dígitos, o 5 a 12 letras/números si es pasaporte.
-- NOT VALID: no revisa filas antiguas (sin número), pero sí todas las nuevas.
alter table public.contact_messages drop constraint if exists contact_documento_valido;
alter table public.contact_messages add constraint contact_documento_valido check (
  (document_type = 'PA' and document_number ~ '^[A-Z0-9]{5,12}$')
  or (document_type <> 'PA' and document_number ~ '^[0-9]{6,10}$')
) not valid;
create index if not exists contact_messages_document_idx on public.contact_messages (document_number);
create index if not exists contact_messages_email_idx on public.contact_messages (email, created_at desc);
alter table public.contact_messages enable row level security;

-- RF-08: el público ya no inserta directamente. Los mensajes entran por la Edge Function
-- "contact", que verifica el CAPTCHA y escribe con la service role.
drop policy if exists "publico envia mensajes" on public.contact_messages;
drop policy if exists "admin gestiona mensajes" on public.contact_messages;
create policy "admin gestiona mensajes" on public.contact_messages
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Anti-spam adicional: máximo 3 mensajes por correo cada hora.
create or replace function public.contact_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    select count(*) from public.contact_messages
    where email = new.email and created_at > now() - interval '1 hour'
  ) >= 3 then
    raise exception 'rate_limit';
  end if;
  return new;
end;
$$;

drop trigger if exists contact_rate_limit on public.contact_messages;
create trigger contact_rate_limit before insert on public.contact_messages
  for each row execute function public.contact_rate_limit();

-- ---------------------------------------------------------------------
-- RF-11: bloqueo tras 5 intentos fallidos durante 15 minutos.
-- Solo la Edge Function "admin-login" (service role) usa estas funciones,
-- así el navegador no puede saltarse el conteo.
-- ---------------------------------------------------------------------
create table if not exists public.login_attempts (
  email text primary key,
  failed_count int not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.login_attempts enable row level security;
-- Sin políticas: solo se accede mediante las funciones de abajo.

create or replace function public.login_locked_until(p_email text)
returns timestamptz
language sql
stable
security definer
set search_path = public
as $$
  select locked_until from public.login_attempts
  where email = lower(p_email) and locked_until > now();
$$;

create or replace function public.register_failed_login(p_email text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  insert into public.login_attempts as la (email, failed_count, updated_at)
  values (lower(p_email), 1, now())
  on conflict (email) do update set
    failed_count = case
      when la.locked_until is not null and la.locked_until <= now() then 1
      when la.updated_at < now() - interval '15 minutes' then 1
      else la.failed_count + 1
    end,
    locked_until = case when la.locked_until <= now() then null else la.locked_until end,
    updated_at = now()
  returning failed_count into v_count;

  if v_count >= 5 then
    update public.login_attempts
      set locked_until = now() + interval '15 minutes', failed_count = 0
      where email = lower(p_email);
    return 0;
  end if;
  return 5 - v_count;
end;
$$;

-- Versión anterior: el navegador limpiaba los intentos. Ahora lo hace la Edge Function.
drop function if exists public.clear_login_attempts();

revoke all on function public.login_locked_until(text) from public, anon, authenticated;
revoke all on function public.register_failed_login(text) from public, anon, authenticated;
grant execute on function public.login_locked_until(text) to service_role;
grant execute on function public.register_failed_login(text) to service_role;

-- ---------------------------------------------------------------------
-- Práctica (Kali Lab): quién juega y con qué resultado.
-- El público no lee ni escribe la tabla directamente: usa start_practice y
-- finish_practice, que solo aceptan el resultado con el token de esa partida.
-- El puntaje lo calcula el navegador (es un juego de práctica, no una evaluación).
-- ---------------------------------------------------------------------
create table if not exists public.practice_attempts (
  id uuid primary key default gen_random_uuid(),
  token uuid not null default gen_random_uuid(),
  player_name text not null check (char_length(player_name) between 2 and 60),
  email text check (email is null or (email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$' and char_length(email) <= 150)),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  score int not null default 0 check (score between 0 and 600),
  max_score int not null default 600,
  missions_completed int not null default 0 check (missions_completed between 0 and 6),
  hints_used int not null default 0,
  duration_seconds int check (duration_seconds >= 0),
  grade text check (grade is null or grade in ('A', 'B', 'C', 'D')),
  recommendation text check (recommendation is null or char_length(recommendation) <= 500),
  details jsonb not null default '[]'::jsonb check (jsonb_typeof(details) = 'array' and pg_column_size(details) < 8000)
);
-- Pistas por paso: hasta 22 en total (ver src/lib/practice/missions.ts).
alter table public.practice_attempts drop constraint if exists practice_attempts_hints_used_check;
alter table public.practice_attempts add constraint practice_attempts_hints_used_check check (hints_used between 0 and 30);
create index if not exists practice_attempts_started_idx on public.practice_attempts (started_at desc);
alter table public.practice_attempts enable row level security;

drop policy if exists "admin gestiona practica" on public.practice_attempts;
create policy "admin gestiona practica" on public.practice_attempts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create or replace function public.start_practice(p_name text, p_email text)
returns table (id uuid, token uuid)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Anti-abuso: máximo 30 partidas nuevas por minuto en total.
  if (select count(*) from public.practice_attempts pa where pa.started_at > now() - interval '1 minute') >= 30 then
    raise exception 'rate_limit';
  end if;
  return query
    insert into public.practice_attempts (player_name, email)
    values (trim(p_name), nullif(lower(trim(p_email)), ''))
    returning practice_attempts.id, practice_attempts.token;
end;
$$;

create or replace function public.finish_practice(
  p_id uuid, p_token uuid, p_score int, p_missions int, p_hints int,
  p_grade text, p_recommendation text, p_details jsonb
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.practice_attempts set
    score = p_score,
    missions_completed = p_missions,
    hints_used = p_hints,
    grade = p_grade,
    recommendation = left(p_recommendation, 500),
    details = p_details,
    finished_at = now(),
    duration_seconds = extract(epoch from now() - started_at)::int
  where id = p_id and token = p_token and finished_at is null
    and started_at > now() - interval '1 day';
$$;

revoke all on function public.start_practice(text, text) from public;
revoke all on function public.finish_practice(uuid, uuid, int, int, int, text, text, jsonb) from public;
grant execute on function public.start_practice(text, text) to anon, authenticated;
grant execute on function public.finish_practice(uuid, uuid, int, int, int, text, text, jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Storage: RF-20, RF-21, RF-22 (límite y tipos también en el servidor)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documentos', 'documentos', true, 10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'image/png',
    'image/jpeg'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('imagenes', 'imagenes', true, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admin sube archivos" on storage.objects;
create policy "admin sube archivos" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('documentos', 'imagenes') and public.is_admin());

drop policy if exists "admin borra archivos" on storage.objects;
create policy "admin borra archivos" on storage.objects
  for delete to authenticated
  using (bucket_id in ('documentos', 'imagenes') and public.is_admin());

-- ---------------------------------------------------------------------
-- Después de crear el usuario admin en Authentication > Users, ejecuta:
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'correo-del-admin@ejemplo.com';
-- ---------------------------------------------------------------------
