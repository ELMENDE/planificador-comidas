/**
 * Servicio de imagenes para recetas.
 *
 * Usa Unsplash Source (gratuito, sin API key) para obtener imagenes
 * basadas en el nombre de la receta. Las URLs se cachean en memoria
 * para no re-calcular.
 *
 * Formato: https://source.unsplash.com/400x300/?{query}
 * Unsplash Source es gratuito y no requiere autenticacion.
 */

const cache = new Map<string, string>()

/**
 * Genera una URL de imagen para una receta.
 * Busca en Unsplash con keywords extraidos del nombre.
 */
export function imagenReceta(nombreReceta: string, ancho = 400, alto = 300): string {
  const cacheKey = `${nombreReceta}_${ancho}x${alto}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  // Extraer keywords relevantes para busqueda de comida
  const palabrasIgnorar = new Set([
    'con', 'de', 'del', 'al', 'a', 'la', 'el', 'las', 'los', 'en', 'y', 'o',
    'por', 'para', 'sin', 'un', 'una', 'unos', 'unas',
  ])

  const keywords = nombreReceta
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .split(/\s+/)
    .filter(w => w.length > 2 && !palabrasIgnorar.has(w))
    .slice(0, 3)

  // Agregar "food" para mejorar resultados
  const query = [...keywords, 'food'].join(',')
  const url = `https://source.unsplash.com/${ancho}x${alto}/?${encodeURIComponent(query)}`

  cache.set(cacheKey, url)
  return url
}

/** Limpia el cache de imagenes. */
export function limpiarCacheImagenes(): void {
  cache.clear()
}
