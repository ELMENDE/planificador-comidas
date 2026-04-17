import { supabase } from './supabase'
import type { GrupoFamiliar, Invitacion, MiembroGrupo } from '@/types/menu'

// =============================================================
// CRUD de Grupos Familiares
// =============================================================

/** Crea un grupo y agrega al creador como owner + primer miembro. */
export async function crearGrupo(input: {
  nombre:              string
  restricciones_grupo: string[]
  cocinas_preferidas:  string[]
  tiempo_max_coccion:  number
  presupuesto?:        number
}): Promise<GrupoFamiliar> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('No autenticado')

  const { data: grupo, error } = await supabase
    .from('grupos')
    .insert({
      nombre:              input.nombre,
      owner_id:            session.user.id,
      restricciones_grupo: input.restricciones_grupo,
      cocinas_preferidas:  input.cocinas_preferidas,
      tiempo_max_coccion:  input.tiempo_max_coccion,
      presupuesto:         input.presupuesto ?? null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Agregar al creador como owner
  const { error: errMiembro } = await supabase
    .from('miembros_grupo')
    .insert({
      grupo_id: grupo.id,
      user_id:  session.user.id,
      rol:      'owner',
    })

  if (errMiembro) throw new Error(errMiembro.message)

  return grupo as GrupoFamiliar
}

/** Lista los grupos del usuario actual, con miembros + perfiles. */
export async function misGrupos(): Promise<GrupoFamiliar[]> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return []

  const { data, error } = await supabase
    .from('miembros_grupo')
    .select(`
      grupo_id,
      grupos (
        id, nombre, owner_id, restricciones_grupo, cocinas_preferidas,
        tiempo_max_coccion, presupuesto, created_at, updated_at
      )
    `)
    .eq('user_id', session.user.id)

  if (error) throw new Error(error.message)
  if (!data) return []

  // Extraer grupos unicos
  const grupos = data
    .map((d: any) => d.grupos as GrupoFamiliar)
    .filter(Boolean)

  // Cargar miembros de cada grupo
  for (const g of grupos) {
    g.miembros = await miembrosDeGrupo(g.id)
  }

  return grupos
}

/** Obtiene un grupo por ID con sus miembros. */
export async function obtenerGrupo(grupoId: string): Promise<GrupoFamiliar | null> {
  const { data, error } = await supabase
    .from('grupos')
    .select('*')
    .eq('id', grupoId)
    .single()

  if (error) return null

  const grupo = data as GrupoFamiliar
  grupo.miembros = await miembrosDeGrupo(grupoId)
  return grupo
}

/** Lista miembros de un grupo con datos de perfil (nombre, emoji, tdee, restricciones). */
export async function miembrosDeGrupo(grupoId: string): Promise<MiembroGrupo[]> {
  const { data, error } = await supabase
    .from('miembros_grupo')
    .select(`
      grupo_id, user_id, rol, apodo, activo, joined_at,
      perfiles:user_id (nombre, emoji, tdee_cache, restricciones)
    `)
    .eq('grupo_id', grupoId)

  if (error) throw new Error(error.message)

  return (data ?? []).map((d: any) => ({
    grupo_id:  d.grupo_id,
    user_id:   d.user_id,
    rol:       d.rol,
    apodo:     d.apodo,
    activo:    d.activo,
    joined_at: d.joined_at,
    perfil:    d.perfiles ?? undefined,
  }))
}

/** Actualiza configuración del grupo (solo owner). */
export async function actualizarGrupo(
  grupoId: string,
  cambios: Partial<Pick<GrupoFamiliar, 'nombre' | 'restricciones_grupo' | 'cocinas_preferidas' | 'tiempo_max_coccion' | 'presupuesto'>>,
): Promise<GrupoFamiliar> {
  const { data, error } = await supabase
    .from('grupos')
    .update({ ...cambios, updated_at: new Date().toISOString() })
    .eq('id', grupoId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as GrupoFamiliar
}

/** Transferir ownership antes de salir. */
export async function transferirOwner(grupoId: string, nuevoOwnerId: string) {
  // 1. Actualizar grupo
  const { error: e1 } = await supabase
    .from('grupos')
    .update({ owner_id: nuevoOwnerId })
    .eq('id', grupoId)

  if (e1) throw new Error(e1.message)

  // 2. Actualizar roles
  const { error: e2 } = await supabase
    .from('miembros_grupo')
    .update({ rol: 'owner' })
    .eq('grupo_id', grupoId)
    .eq('user_id', nuevoOwnerId)

  if (e2) throw new Error(e2.message)
}

/** El usuario actual sale del grupo. Si es owner, debe transferir antes. */
export async function salirDeGrupo(grupoId: string) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('No autenticado')

  const { error } = await supabase
    .from('miembros_grupo')
    .delete()
    .eq('grupo_id', grupoId)
    .eq('user_id', session.user.id)

  if (error) throw new Error(error.message)
}

/** Owner expulsa a un miembro. */
export async function expulsarMiembro(grupoId: string, userId: string) {
  const { error } = await supabase
    .from('miembros_grupo')
    .delete()
    .eq('grupo_id', grupoId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
}

/** Owner borra el grupo entero (cascade borra miembros, menus, etc). */
export async function borrarGrupo(grupoId: string) {
  const { error } = await supabase
    .from('grupos')
    .delete()
    .eq('id', grupoId)

  if (error) throw new Error(error.message)
}

/** Toggle "activo" de un miembro (¿come hoy?). */
export async function toggleMiembroActivo(grupoId: string, userId: string, activo: boolean) {
  const { error } = await supabase
    .from('miembros_grupo')
    .update({ activo })
    .eq('grupo_id', grupoId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
}

// =============================================================
// Invitaciones
// =============================================================

/** Owner genera una invitación (link de 7 días, single-use). */
export async function crearInvitacion(grupoId: string): Promise<Invitacion> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('invitaciones')
    .insert({
      grupo_id:   grupoId,
      creada_por: session.user.id,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Invitacion
}

/** Busca una invitación por token (cualquier usuario autenticado). */
export async function buscarInvitacion(token: string): Promise<Invitacion | null> {
  const { data, error } = await supabase
    .from('invitaciones')
    .select('*, grupos:grupo_id (nombre)')
    .eq('token', token)
    .single()

  if (error) return null

  return {
    ...data,
    grupo: data.grupos,
  } as unknown as Invitacion
}

/** Aceptar invitación: el usuario se une al grupo. */
export async function aceptarInvitacion(token: string): Promise<GrupoFamiliar> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('No autenticado')

  const inv = await buscarInvitacion(token)
  if (!inv) throw new Error('Invitacion no encontrada')
  if (inv.usada) throw new Error('Esta invitacion ya fue usada')
  if (new Date(inv.expira_at) < new Date()) throw new Error('Invitacion expirada')

  // 1. Agregar como miembro
  const { error: e1 } = await supabase
    .from('miembros_grupo')
    .insert({
      grupo_id: inv.grupo_id,
      user_id:  session.user.id,
      rol:      'miembro',
    })

  if (e1) {
    if (e1.message.includes('duplicate')) {
      throw new Error('Ya sos miembro de este grupo')
    }
    throw new Error(e1.message)
  }

  // 2. Marcar invitación como usada
  await supabase
    .from('invitaciones')
    .update({ usada: true, usada_por: session.user.id })
    .eq('id', inv.id)

  // 3. Devolver el grupo
  const grupo = await obtenerGrupo(inv.grupo_id)
  if (!grupo) throw new Error('Grupo no encontrado')
  return grupo
}

/** Owner lista invitaciones pendientes de su grupo. */
export async function invitacionesPendientes(grupoId: string): Promise<Invitacion[]> {
  const { data, error } = await supabase
    .from('invitaciones')
    .select('*')
    .eq('grupo_id', grupoId)
    .eq('usada', false)
    .gt('expira_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as Invitacion[]
}

/** Owner revoca (borra) una invitación pendiente. */
export async function revocarInvitacion(invitacionId: string) {
  const { error } = await supabase
    .from('invitaciones')
    .delete()
    .eq('id', invitacionId)

  if (error) throw new Error(error.message)
}

// =============================================================
// Helpers para el prompt de Claude
// =============================================================

/**
 * Construye un PerfilParaPrompt a partir de un grupo,
 * para pasarle al prompt de Claude y al generador de menús.
 * Suma los TDEE de todos los miembros activos.
 */
export function grupoAPerfilHogar(grupo: GrupoFamiliar): import('@/lib/prompts').PerfilParaPrompt {
  const activos = (grupo.miembros ?? []).filter(m => m.activo)
  const totalTdee = activos.reduce((sum, m) => sum + (m.perfil?.tdee_cache ?? 2000), 0)
  const totalPersonas = activos.length || 1

  // Restricciones = las del grupo (obligatorias para todos)
  const restricciones = grupo.restricciones_grupo ?? []

  return {
    nombre:             grupo.nombre,
    personas:           totalPersonas,
    presupuesto:        grupo.presupuesto ?? undefined,
    restricciones,
    cocinas_preferidas: grupo.cocinas_preferidas ?? [],
    tiempo_max_coccion: grupo.tiempo_max_coccion ?? 45,
    tdee_total_grupo:   totalTdee,
    tdee_por_persona:   Math.round(totalTdee / totalPersonas),
  }
}

/**
 * Construye un PerfilParaPrompt para un usuario que no tiene grupo.
 * Usa los datos del perfil personal como si fuera un "grupo de 1".
 */
export function perfilSoloAHogar(perfil: import('@/types/menu').Perfil): import('@/lib/prompts').PerfilParaPrompt {
  const tdee = perfil.tdee_cache ?? 2000
  return {
    nombre:             perfil.nombre,
    personas:           1,
    restricciones:      perfil.restricciones ?? [],
    cocinas_preferidas: [],
    tiempo_max_coccion: 45,
    tdee_total_grupo:   tdee,
    tdee_por_persona:   tdee,
  }
}
