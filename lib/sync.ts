import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Categoria, ItemDespensa, ItemExtra, MenuSemanal, Receta, Unidad } from '@/types/menu'

// =============================================================
// Tildados — checkmarks en la lista de compras, sincronizados
// =============================================================

export async function cargarTildados(grupoId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('tildados')
    .select('clave')
    .eq('grupo_id', grupoId)

  if (error) throw new Error(error.message)
  return (data ?? []).map(d => d.clave)
}

export async function tildar(grupoId: string, menuId: string, clave: string) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return

  const { error } = await supabase
    .from('tildados')
    .upsert({
      grupo_id:    grupoId,
      menu_id:     menuId,
      clave,
      tildado_por: session.user.id,
    }, { onConflict: 'grupo_id,menu_id,clave' })

  if (error) throw new Error(error.message)
}

export async function destildar(grupoId: string, clave: string) {
  const { error } = await supabase
    .from('tildados')
    .delete()
    .eq('grupo_id', grupoId)
    .eq('clave', clave)

  if (error) throw new Error(error.message)
}

export async function limpiarTildadosGrupo(grupoId: string) {
  const { error } = await supabase
    .from('tildados')
    .delete()
    .eq('grupo_id', grupoId)

  if (error) throw new Error(error.message)
}

// =============================================================
// Despensa — items que ya tienen en casa, compartida por grupo
// =============================================================

export async function cargarDespensa(grupoId: string): Promise<ItemDespensa[]> {
  const { data, error } = await supabase
    .from('despensa')
    .select('id, nombre, cantidad, unidad')
    .eq('grupo_id', grupoId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as ItemDespensa[]
}

export async function agregarDespensaRemoto(grupoId: string, item: Omit<ItemDespensa, 'id'>): Promise<ItemDespensa> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('despensa')
    .insert({
      grupo_id:     grupoId,
      nombre:       item.nombre,
      cantidad:     item.cantidad ?? null,
      unidad:       item.unidad ?? null,
      agregado_por: session.user.id,
    })
    .select('id, nombre, cantidad, unidad')
    .single()

  if (error) throw new Error(error.message)
  return data as ItemDespensa
}

export async function quitarDespensaRemoto(id: string) {
  const { error } = await supabase
    .from('despensa')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// =============================================================
// Items Extras — items manuales en la lista de compras
// =============================================================

export async function cargarItemsExtras(grupoId: string): Promise<ItemExtra[]> {
  const { data, error } = await supabase
    .from('items_extras')
    .select('id, nombre, cantidad, unidad, categoria')
    .eq('grupo_id', grupoId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []).map(d => ({
    id:        d.id,
    nombre:    d.nombre,
    cantidad:  Number(d.cantidad),
    unidad:    d.unidad as Unidad,
    categoria: d.categoria as Categoria,
  }))
}

export async function agregarItemExtraRemoto(
  grupoId: string,
  item: Omit<ItemExtra, 'id'>,
): Promise<ItemExtra> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('items_extras')
    .insert({
      grupo_id:     grupoId,
      nombre:       item.nombre,
      cantidad:     item.cantidad,
      unidad:       item.unidad,
      categoria:    item.categoria,
      agregado_por: session.user.id,
    })
    .select('id, nombre, cantidad, unidad, categoria')
    .single()

  if (error) throw new Error(error.message)
  return {
    id:        data.id,
    nombre:    data.nombre,
    cantidad:  Number(data.cantidad),
    unidad:    data.unidad as Unidad,
    categoria: data.categoria as Categoria,
  }
}

export async function quitarItemExtraRemoto(id: string) {
  const { error } = await supabase
    .from('items_extras')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// =============================================================
// Menus — guardar y cargar el menu actual del grupo
// =============================================================

export async function guardarMenuRemoto(
  grupoId: string,
  menu: MenuSemanal,
  kcalTotal: number,
): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('No autenticado')

  // Desmarcar menus anteriores como no-actuales
  await supabase
    .from('menus')
    .update({ es_actual: false })
    .eq('grupo_id', grupoId)
    .eq('es_actual', true)

  const { data, error } = await supabase
    .from('menus')
    .insert({
      grupo_id:         grupoId,
      generado_por:     session.user.id,
      menu_json:        menu as any,
      kcal_grupo_total: kcalTotal,
      es_actual:        true,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return data.id
}

export async function cargarMenuActual(grupoId: string): Promise<{ menuId: string; menu: MenuSemanal } | null> {
  const { data, error } = await supabase
    .from('menus')
    .select('id, menu_json')
    .eq('grupo_id', grupoId)
    .eq('es_actual', true)
    .order('generado_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  return { menuId: data.id, menu: data.menu_json as unknown as MenuSemanal }
}

// =============================================================
// Realtime subscriptions
// =============================================================

type SyncCallbacks = {
  onTildadosChange:    (tildados: string[]) => void
  onDespensaChange:    (despensa: ItemDespensa[]) => void
  onItemsExtrasChange: (extras: ItemExtra[]) => void
  onMenuChange:        (menu: MenuSemanal | null) => void
}

let activeChannel: RealtimeChannel | null = null

/**
 * Suscribe a cambios realtime de un grupo.
 * Cada vez que alguien del grupo modifica tildados, despensa o items_extras,
 * se recargan los datos y se llama al callback correspondiente.
 */
export function suscribirRealtime(grupoId: string, callbacks: SyncCallbacks) {
  // Limpiar suscripcion anterior
  desuscribirRealtime()

  const channel = supabase
    .channel(`grupo-sync-${grupoId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tildados', filter: `grupo_id=eq.${grupoId}` },
      async () => {
        try {
          const t = await cargarTildados(grupoId)
          callbacks.onTildadosChange(t)
        } catch { /* offline */ }
      },
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'despensa', filter: `grupo_id=eq.${grupoId}` },
      async () => {
        try {
          const d = await cargarDespensa(grupoId)
          callbacks.onDespensaChange(d)
        } catch { /* offline */ }
      },
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'items_extras', filter: `grupo_id=eq.${grupoId}` },
      async () => {
        try {
          const e = await cargarItemsExtras(grupoId)
          callbacks.onItemsExtrasChange(e)
        } catch { /* offline */ }
      },
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'menus', filter: `grupo_id=eq.${grupoId}` },
      async () => {
        try {
          const result = await cargarMenuActual(grupoId)
          callbacks.onMenuChange(result?.menu ?? null)
        } catch { /* offline */ }
      },
    )
    .subscribe()

  activeChannel = channel
}

export function desuscribirRealtime() {
  if (activeChannel) {
    supabase.removeChannel(activeChannel)
    activeChannel = null
  }
}

// =============================================================
// Favoritos — por usuario, sincronizados con Supabase
// =============================================================

export async function cargarFavoritos(): Promise<Receta[]> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return []

  const { data, error } = await supabase
    .from('favoritos')
    .select('id, receta_json')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map(d => ({
    ...(d.receta_json as unknown as Receta),
    _favId: d.id,  // guardamos el ID de Supabase para poder borrar
  })) as (Receta & { _favId: string })[]
}

export async function agregarFavoritoRemoto(receta: Receta): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('favoritos')
    .insert({
      user_id:     session.user.id,
      receta_json: receta as any,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return data.id
}

export async function quitarFavoritoRemoto(recetaNombre: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return

  // Buscamos por user_id y nombre dentro del JSONB
  const { data } = await supabase
    .from('favoritos')
    .select('id, receta_json')
    .eq('user_id', session.user.id)

  const match = (data ?? []).find(d =>
    (d.receta_json as any)?.nombre === recetaNombre,
  )

  if (match) {
    await supabase.from('favoritos').delete().eq('id', match.id)
  }
}

// =============================================================
// Historial de menus — lista de menus pasados del grupo
// =============================================================

export interface HistorialEntry {
  id:          string
  menu_id:     string
  semana:      string
  favorito:    boolean
  created_at:  string
  menu:        MenuSemanal | null
  generado_at: string | null
  kcal:        number | null
}

export async function cargarHistorial(grupoId: string): Promise<HistorialEntry[]> {
  const { data, error } = await supabase
    .from('historial_menus')
    .select(`
      id, menu_id, semana, favorito, created_at,
      menus:menu_id (menu_json, generado_at, kcal_grupo_total)
    `)
    .eq('grupo_id', grupoId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) throw new Error(error.message)

  return (data ?? []).map((d: any) => ({
    id:          d.id,
    menu_id:     d.menu_id,
    semana:      d.semana,
    favorito:    d.favorito,
    created_at:  d.created_at,
    menu:        d.menus?.menu_json as MenuSemanal | null,
    generado_at: d.menus?.generado_at ?? null,
    kcal:        d.menus?.kcal_grupo_total ?? null,
  }))
}

export async function guardarEnHistorial(grupoId: string, menuId: string): Promise<void> {
  const ahora = new Date()
  const lunes = new Date(ahora)
  lunes.setDate(ahora.getDate() - ahora.getDay() + 1)
  const semana = lunes.toISOString().slice(0, 10)

  await supabase
    .from('historial_menus')
    .upsert({
      grupo_id: grupoId,
      menu_id:  menuId,
      semana,
    }, { onConflict: 'grupo_id,menu_id' })
}

export async function toggleFavoritoHistorial(entryId: string, favorito: boolean): Promise<void> {
  await supabase
    .from('historial_menus')
    .update({ favorito })
    .eq('id', entryId)
}
