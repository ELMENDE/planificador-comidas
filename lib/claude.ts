import { supabase } from './supabase'
import { MODELO_IA } from './prompts'

export class ClaudeError extends Error {
  constructor(message: string, public status?: number) {
    super(message)
    this.name = 'ClaudeError'
  }
}

/**
 * Llama a Claude a través de la Edge Function `claude-proxy`.
 * La API key de Anthropic vive solo en el servidor — nunca en el cliente.
 *
 * Si no hay grupo activo (usuario suelto en modo mock), se tira error
 * porque las llamadas reales siempre requieren un grupo para rate limiting.
 */
export async function callClaude(
  prompt: string,
  maxTokens: number,
  grupoId?: string,
  tipo: 'menu' | 'reemplazo' = 'menu',
): Promise<string> {
  if (!grupoId) {
    throw new ClaudeError(
      'Necesitás pertenecer a un grupo para generar menus con IA. Creá o unite a un grupo en Perfil.',
    )
  }

  // Obtener sesion para el JWT
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new ClaudeError('No hay sesión activa. Volvé a iniciar sesión.')
  }

  const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/claude-proxy`

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        grupo_id:   grupoId,
        prompt,
        max_tokens: maxTokens,
        modelo:     MODELO_IA,
        tipo,
      }),
    })
  } catch (e) {
    throw new ClaudeError(
      e instanceof Error ? `Error de red: ${e.message}` : 'Error de red desconocido',
    )
  }

  if (!res.ok) {
    let detalle = `HTTP ${res.status}`
    try {
      const err = await res.json()
      if (err?.error) detalle = err.error
    } catch { /* ignore */ }
    throw new ClaudeError(detalle, res.status)
  }

  const data = await res.json()

  if (!data?.text) {
    throw new ClaudeError('Respuesta vacía del servidor')
  }

  return data.text
}

/** Parsea JSON devuelto por la IA tolerando backticks y texto accidental. */
export function extraerJSON<T>(texto: string): T {
  const limpio = texto
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```$/i, '')
    .trim()
  try {
    return JSON.parse(limpio) as T
  } catch {
    const match = limpio.match(/\{[\s\S]*\}/)
    if (!match) throw new ClaudeError('La IA no devolvio JSON valido')
    return JSON.parse(match[0]) as T
  }
}
