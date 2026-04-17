-- ─────────────────────────────────────────────────────────────────────────────
-- Analytics: tabla de eventos de uso
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists analytics_eventos (
  id          bigserial primary key,
  usuario_id  uuid references auth.users(id) on delete set null,
  evento      text not null,
  propiedades jsonb,
  plataforma  text,          -- 'ios' | 'android'
  version     text,          -- version de la app
  created_at  timestamptz default now()
);

-- Índices para consultas frecuentes
create index if not exists idx_analytics_evento     on analytics_eventos (evento);
create index if not exists idx_analytics_usuario    on analytics_eventos (usuario_id);
create index if not exists idx_analytics_created    on analytics_eventos (created_at);

-- RLS
alter table analytics_eventos enable row level security;

-- El usuario puede insertar sus propios eventos (o eventos anónimos)
create policy "insert own events"
  on analytics_eventos for insert
  with check (usuario_id = auth.uid() or usuario_id is null);

-- Nadie puede leer desde el cliente (solo desde el dashboard de Supabase)
create policy "no client select"
  on analytics_eventos for select
  using (false);
