import { registrarEvento, EVENTOS } from './analytics'
import { supabase } from './supabase'

/**
 * Sistema de auth con Supabase.
 *
 * - Registro con email + password (Supabase Auth).
 * - Al crear usuario, un trigger en la DB crea la fila en `perfiles`.
 * - La sesion se persiste automaticamente en AsyncStorage via el SDK.
 */

export type Rol = 'admin' | 'user'

export interface Usuario {
  id:           string
  email:        string
  nombre:       string
  rol:          Rol
  createdAt:    string
  ultimoAcceso: string
}

// ---------- Helpers ----------

/** Convierte la session de Supabase a nuestro tipo Usuario. */
function sessionToUsuario(
  user: { id: string; email?: string; created_at: string; last_sign_in_at?: string | null; user_metadata?: Record<string, any> },
): Usuario {
  return {
    id:           user.id,
    email:        user.email ?? '',
    nombre:       user.user_metadata?.nombre ?? user.email?.split('@')[0] ?? '',
    rol:          'user', // el admin se maneja en Supabase (owner del grupo)
    createdAt:    user.created_at,
    ultimoAcceso: user.last_sign_in_at ?? user.created_at,
  }
}

// ---------- API publica ----------

export interface RegistroResult {
  usuario:              Usuario
  emailConfirmRequired: boolean
}

export async function registrar(input: {
  email:    string
  password: string
  nombre:   string
}): Promise<RegistroResult> {
  const email = input.email.trim().toLowerCase()
  if (!email || !email.includes('@')) throw new Error('Email invalido')
  if (input.password.length < 6) throw new Error('La contrasena debe tener al menos 6 caracteres')

  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      // Sin emailRedirectTo → Supabase manda un codigo OTP de 6 digitos en vez de link
      data: { nombre: input.nombre.trim() || email.split('@')[0] },
    },
  })

  if (error) throw new Error(error.message)
  if (!data.user) throw new Error('No se pudo crear la cuenta')

  const needsConfirm = !data.session

  if (!needsConfirm) {
    await supabase
      .from('perfiles')
      .update({ nombre: input.nombre.trim() || email.split('@')[0] })
      .eq('id', data.user.id)
  }

  registrarEvento(EVENTOS.REGISTRO, { email_confirm_required: needsConfirm })

  return {
    usuario: sessionToUsuario(data.user),
    emailConfirmRequired: needsConfirm,
  }
}

/** Verifica el codigo OTP de 6 digitos que llego al email al registrarse. */
export async function verificarOTP(email: string, codigo: string): Promise<Usuario> {
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: codigo.trim(),
    type:  'signup',
  })

  if (error) {
    if (error.message.includes('expired')) {
      throw new Error('El codigo expiro. Registrate de nuevo para recibir uno nuevo.')
    }
    if (error.message.includes('invalid')) {
      throw new Error('Codigo incorrecto. Revisalo y volvé a intentar.')
    }
    throw new Error(error.message)
  }

  if (!data.user) throw new Error('No se pudo verificar el codigo')

  return sessionToUsuario(data.user)
}

export async function login(email: string, password: string): Promise<Usuario> {
  const e = email.trim().toLowerCase()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: e,
    password,
  })

  if (error) {
    if (error.message.includes('Invalid login')) {
      throw new Error('Email o contrasena incorrecta')
    }
    if (error.message.includes('Email not confirmed')) {
      throw new Error('Revisa tu email y confirma tu cuenta antes de iniciar sesion')
    }
    throw new Error(error.message)
  }

  if (!data.user) throw new Error('No se pudo iniciar sesion')
  registrarEvento(EVENTOS.LOGIN)
  return sessionToUsuario(data.user)
}

export async function logout(): Promise<void> {
  registrarEvento(EVENTOS.LOGOUT)
  await supabase.auth.signOut()
}

export async function sesionActual(): Promise<Usuario | null> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return null
  return sessionToUsuario(session.user)
}

// ---------- Edicion de cuenta ----------

export async function actualizarUsuario(
  _id: string,
  cambios: { nombre?: string; email?: string },
): Promise<Usuario> {
  const updates: Record<string, any> = {}
  if (cambios.email) updates.email = cambios.email.trim().toLowerCase()
  if (cambios.nombre) {
    updates.data = { nombre: cambios.nombre.trim() }
  }

  const { data, error } = await supabase.auth.updateUser(updates)
  if (error) throw new Error(error.message)
  if (!data.user) throw new Error('No se pudo actualizar')

  // Sync nombre al perfil
  if (cambios.nombre) {
    await supabase
      .from('perfiles')
      .update({ nombre: cambios.nombre.trim() })
      .eq('id', data.user.id)
  }

  return sessionToUsuario(data.user)
}

export async function cambiarPassword(
  _id: string,
  _passwordActual: string,
  passwordNueva: string,
): Promise<void> {
  if (passwordNueva.length < 6) {
    throw new Error('La nueva contrasena debe tener al menos 6 caracteres')
  }

  const { error } = await supabase.auth.updateUser({ password: passwordNueva })
  if (error) throw new Error(error.message)
}

// ---------- Perfil ----------

export async function obtenerPerfil(userId: string) {
  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function actualizarPerfil(
  userId: string,
  campos: Record<string, any>,
) {
  const { data, error } = await supabase
    .from('perfiles')
    .update({ ...campos, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

// ---------- Borrar cuenta ----------

/** El usuario se elimina a sí mismo via Edge Function (usa service_role en el servidor). */
export async function borrarCuenta(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('No hay sesion activa')

  const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/delete-account`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? 'Error al borrar cuenta')
  }

  registrarEvento(EVENTOS.BORRAR_CUENTA)
  await supabase.auth.signOut()
}

// ---------- Compat con imports viejos (no-ops, se irán removiendo) ----------

export async function listarUsuarios(): Promise<Usuario[]> {
  return []
}

export async function eliminarUsuario(_id: string): Promise<void> {}
export async function cambiarRol(_id: string, _rol: Rol): Promise<void> {}
export async function resetearAuth(): Promise<void> {
  await supabase.auth.signOut()
}
