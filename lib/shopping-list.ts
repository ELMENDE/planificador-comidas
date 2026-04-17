import type {
  Categoria,
  Ingrediente,
  ItemDespensa,
  ItemLista,
  MenuSemanal,
} from '@/types/menu'

const ORDEN_CATEGORIAS: Categoria[] = [
  'verduras',
  'frutas',
  'proteinas',
  'lacteos',
  'panaderia',
  'almacen',
  'condimentos',
]

/**
 * Pone la primera letra en mayuscula, respetando el resto del string.
 * Si el string tiene varias palabras solo capitaliza la primera
 * (ej: "pan integral" -> "Pan integral").
 */
export function capitalizar(s: string): string {
  if (!s) return s
  const trimmed = s.trimStart()
  if (!trimmed) return s
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

export const EMOJI_CATEGORIA: Record<Categoria, string> = {
  verduras:    '🥬',
  frutas:      '🍎',
  proteinas:   '🍗',
  lacteos:     '🥛',
  panaderia:   '🍞',
  almacen:     '🛒',
  condimentos: '🧂',
}

function normalizar(ing: Ingrediente): Ingrediente {
  switch (ing.unidad) {
    case 'kg':  return { ...ing, cantidad: ing.cantidad * 1000, unidad: 'g' }
    case 'l':   return { ...ing, cantidad: ing.cantidad * 1000, unidad: 'ml' }
    case 'cda': return { ...ing, cantidad: ing.cantidad * 3,    unidad: 'cdita' }
    default:    return ing
  }
}

function presentarBonito(ing: Ingrediente): Ingrediente {
  if (ing.unidad === 'g'  && ing.cantidad >= 1000) {
    return { ...ing, cantidad: +(ing.cantidad / 1000).toFixed(2), unidad: 'kg' }
  }
  if (ing.unidad === 'ml' && ing.cantidad >= 1000) {
    return { ...ing, cantidad: +(ing.cantidad / 1000).toFixed(2), unidad: 'l' }
  }
  return { ...ing, cantidad: +ing.cantidad.toFixed(2) }
}

function claveDe(ing: Ingrediente): string {
  return `${ing.nombre.toLowerCase().trim()}__${ing.unidad}`
}

export function generarListaCompras(
  menu:     MenuSemanal,
  despensa: ItemDespensa[] = [],
): ItemLista[] {
  const acumulado = new Map<string, Ingrediente>()

  for (const dia of menu.dias) {
    for (const receta of [dia.desayuno, dia.almuerzo, dia.cena]) {
      for (const ing of receta.ingredientes) {
        const norm  = normalizar(ing)
        const clave = claveDe(norm)
        const prev  = acumulado.get(clave)
        acumulado.set(
          clave,
          prev ? { ...prev, cantidad: prev.cantidad + norm.cantidad } : norm,
        )
      }
    }
  }

  const despensaSet = new Set(despensa.map(d => d.nombre.toLowerCase().trim()))

  const items: ItemLista[] = Array.from(acumulado.values())
    .map(presentarBonito)
    .map(ing => ({
      ...ing,
      en_despensa: despensaSet.has(ing.nombre.toLowerCase().trim()),
      tildado:     false,
    }))

  items.sort((a, b) => {
    const ia = ORDEN_CATEGORIAS.indexOf(a.categoria)
    const ib = ORDEN_CATEGORIAS.indexOf(b.categoria)
    if (ia !== ib) return ia - ib
    return a.nombre.localeCompare(b.nombre)
  })

  return items
}

export function keyItem(i: ItemLista): string {
  return `${i.nombre.toLowerCase()}__${i.unidad}`
}

/** Formato de texto plano para compartir via share sheet del sistema. */
export function listaATexto(items: ItemLista[]): string {
  const visibles = items.filter(i => !i.en_despensa)
  const porCategoria = new Map<Categoria, ItemLista[]>()
  for (const it of visibles) {
    const arr = porCategoria.get(it.categoria) ?? []
    arr.push(it)
    porCategoria.set(it.categoria, arr)
  }

  const lineas: string[] = ['🛒 Lista de compras', '']
  for (const cat of ORDEN_CATEGORIAS) {
    const arr = porCategoria.get(cat)
    if (!arr?.length) continue
    lineas.push(`${EMOJI_CATEGORIA[cat]} ${cat.toUpperCase()}`)
    for (const it of arr) {
      lineas.push(`  • ${capitalizar(it.nombre)} — ${it.cantidad} ${it.unidad}`)
    }
    lineas.push('')
  }
  return lineas.join('\n').trim()
}

/** Formato de texto plano del menu semanal para compartir. */
export function menuATexto(menu: MenuSemanal): string {
  const lineas: string[] = ['🍽️ Menu semanal', '']
  for (const dia of menu.dias) {
    lineas.push(`📅 ${dia.dia.toUpperCase()}`)
    lineas.push(`  🥐 ${dia.desayuno.nombre} (${dia.desayuno.calorias} kcal, ${dia.desayuno.tiempo_minutos} min)`)
    lineas.push(`  🥗 ${dia.almuerzo.nombre} (${dia.almuerzo.calorias} kcal, ${dia.almuerzo.tiempo_minutos} min)`)
    lineas.push(`  🍝 ${dia.cena.nombre} (${dia.cena.calorias} kcal, ${dia.cena.tiempo_minutos} min)`)
    lineas.push('')
  }
  lineas.push('Generado con Healthwise 🍳')
  return lineas.join('\n').trim()
}

/** Estadisticas semanales rapidas para la home. */
export function estadisticasMenu(menu: MenuSemanal) {
  let caloriasTotal  = 0
  let tiempoTotal    = 0
  const cocinas      = new Set<string>()
  let vegetarianos   = 0

  for (const dia of menu.dias) {
    for (const r of [dia.desayuno, dia.almuerzo, dia.cena]) {
      caloriasTotal += r.calorias ?? 0
      tiempoTotal   += r.tiempo_minutos ?? 0
      for (const t of r.tags ?? []) cocinas.add(t)
      if (r.tags?.includes('vegetariano') || r.tags?.includes('vegano')) {
        vegetarianos++
      }
    }
  }

  return {
    caloriasPromedioDiario: Math.round(caloriasTotal / 7),
    tiempoTotalMinutos:     tiempoTotal,
    variedadTags:           cocinas.size,
    platosVegetarianos:     vegetarianos,
  }
}
