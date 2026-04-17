/**
 * Analytics — registro de eventos de uso
 *
 * Estrategia: tabla `analytics_eventos` en Supabase.
 * Liviana, sin dependencias externas, y los datos quedan en tu propia DB.
 *
 * Esquema SQL (ejecutar en Supabase):
 * ─────────────────────────────────────────────────────────────────────
 * create table if not exists analytics_eventos (
 *   id          bigserial primary key,
 *   usuario_id  uuid references auth.users(id) on delete set null,
 *   evento      text not null,
 *   propiedades jsonb,
 *   plataforma  text,
 *   version     text,
 *   created_at  timestamptz default now()
 * );
 * -- Solo el usuario puede insertar sus propios eventos
 * alter table analytics_eventos enable row level security;
 * create policy "insert own events" on analytics_eventos
 *   for insert with check (usuario_id = auth.uid() or usuario_id is null);
 * -- Nadie puede leer desde el cliente (solo desde el dashboard de Supabase)
 * create policy "no select" on analytics_eventos for select using (false);
 * ─────────────────────────────────────────────────────────────────────
 */

import { Platform } from 'react-native'
import { supabase } from './supabase'

// ─── Catálogo de eventos ───────────────────────────────────────────────────────
// Usar constantes evita typos y facilita buscar en el código dónde se dispara cada evento.

export const EVENTOS = {
  // Auth
  LOGIN:              'auth_login',
  REGISTRO:           'auth_registro',
  LOGOUT:             'auth_logout',
  BORRAR_CUENTA:      'auth_borrar_cuenta',

  // Onboarding
  ONBOARDING_INICIO:  'onboarding_inicio',
  ONBOARDING_FIN:     'onboarding_fin',

  // Menú
  MENU_GENERADO:      'menu_generado',
  MENU_REGENERADO:    'menu_regenerado',
  RECETA_REEMPLAZADA: 'receta_reemplazada',
  MENU_COMPARTIDO:    'menu_compartido',

  // Despensa / cook mode
  DESPENSA_SUGERENCIA: 'despensa_sugerencia',

  // Lista de compras
  LISTA_GENERADA:     'lista_generada',
  LISTA_COMPARTIDA:   'lista_compartida',

  // Grupos
  GRUPO_CREADO:       'grupo_creado',
  GRUPO_INVITACION:   'grupo_invitacion_creada',
  GRUPO_UNIRSE:       'grupo_unirse',
  GRUPO_SALIR:        'grupo_salir',

  // Favoritos / historial
  RECETA_FAVORITA:    'receta_favorita_toggle',
  HISTORIAL_VISTO:    'historial_visto',

  // Ajustes
  NOTIFICACIONES_TOGGLE: 'notificaciones_toggle',
  TEMA_CAMBIADO:      'tema_cambiado',
} as const

export type NombreEvento = typeof EVENTOS[keyof typeof EVENTOS]

// ─── Impl ─────────────────────────────────────────────────────────────────────

/** Registrar un evento. No lanza excepciones — los fallos se ignoran silenciosamente. */
export async function registrarEvento(
  evento: NombreEvento,
  propiedades?: Record<string, unknown>,
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('analytics_eventos').insert({
      usuario_id:  user?.id ?? null,
      evento,
      propiedades: propiedades ?? null,
      plataforma:  Platform.OS,
      version:     '0.1.0',
    })
  } catch {
    // Analytics nunca debe romper la app
  }
}

/** Registrar múltiples eventos a la vez. */
export async function registrarEventos(
  eventos: Array<{ evento: NombreEvento; propiedades?: Record<string, unknown> }>,
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    const rows = eventos.map(({ evento, propiedades }) => ({
      usuario_id:  user?.id ?? null,
      evento,
      propiedades: propiedades ?? null,
      plataforma:  Platform.OS,
      version:     '0.1.0',
    }))

    await supabase.from('analytics_eventos').insert(rows)
  } catch {
    // ignorar
  }
}
