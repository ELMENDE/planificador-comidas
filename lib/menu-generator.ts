import type { MenuSemanal, Receta, TipoComida } from '@/types/menu'
import { capturarError } from './sentry'
import { callClaude, ClaudeError, extraerJSON } from './claude'
import { MOCK_MENU, mockReemplazo } from './mock-data'
import type { PerfilParaPrompt } from './prompts'
import {
  buildPromptMenuSemanal,
  buildPromptReemplazo,
  buildPromptConDespensa,
  MAX_TOKENS_MENU_COMPLETO,
  MAX_TOKENS_REEMPLAZO,
  MAX_TOKENS_SUGERENCIA_DESPENSA,
} from './prompts'

function nuevoId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/** Espera artificial para que se vea el loading en modo mock. */
function esperar(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

/**
 * Escala una receta al numero de personas indicado.
 * Ajusta cantidades de ingredientes y calorias proporcionalmente.
 */
export function escalarReceta(r: Receta, personas: number): Receta {
  const base   = r.porciones || 2
  const factor = personas / base
  if (factor === 1) return r
  return {
    ...r,
    porciones: personas,
    calorias:  Math.round((r.calorias || 0) * factor),
    ingredientes: r.ingredientes.map(ing => ({
      ...ing,
      cantidad: Math.round(ing.cantidad * factor * 100) / 100,
    })),
  }
}

export async function generarMenuSemanal(
  perfil: PerfilParaPrompt,
  modoMock = false,
  grupoId?: string,
): Promise<MenuSemanal> {
  if (modoMock) {
    await esperar(1200)
    const clonado: MenuSemanal = JSON.parse(JSON.stringify(MOCK_MENU))
    clonado.id         = nuevoId()
    clonado.generadoAt = new Date().toISOString()

    const personas = Math.max(1, perfil.personas || 1)
    const tdeeTotal = perfil.tdee_total_grupo
    const targetDes = Math.round(tdeeTotal * 0.25)
    const targetAlm = Math.round(tdeeTotal * 0.40)
    const targetCen = Math.round(tdeeTotal * 0.35)

    for (const dia of clonado.dias) {
      dia.desayuno = escalarReceta(dia.desayuno, personas)
      dia.almuerzo = escalarReceta(dia.almuerzo, personas)
      dia.cena     = escalarReceta(dia.cena,     personas)
      dia.desayuno.calorias = targetDes
      dia.almuerzo.calorias = targetAlm
      dia.cena.calorias     = targetCen
      dia.desayuno.id = nuevoId()
      dia.almuerzo.id = nuevoId()
      dia.cena.id     = nuevoId()
    }
    return clonado
  }

  const prompt = buildPromptMenuSemanal(perfil)
  let texto: string
  try {
    texto = await callClaude(prompt, MAX_TOKENS_MENU_COMPLETO, grupoId, 'menu')
  } catch (err) {
    capturarError(err, { funcion: 'generarMenuSemanal', personas: perfil.personas })
    throw err
  }
  const parsed = extraerJSON<{ dias: MenuSemanal['dias'] }>(texto)

  if (!parsed.dias || parsed.dias.length !== 7) {
    const error = new ClaudeError(
      `Se esperaban 7 dias, llegaron ${parsed.dias?.length ?? 0}`,
    )
    capturarError(error, { funcion: 'generarMenuSemanal', raw: texto.slice(0, 200) })
    throw error
  }

  for (const dia of parsed.dias) {
    dia.desayuno.id = nuevoId()
    dia.almuerzo.id = nuevoId()
    dia.cena.id     = nuevoId()
  }

  return {
    id:         nuevoId(),
    generadoAt: new Date().toISOString(),
    dias:       parsed.dias,
  }
}

export interface SugerenciaDespensa extends Receta {
  usa_de_despensa: string[]
}

export async function sugerirConDespensa(
  perfil:       PerfilParaPrompt,
  ingredientes: string[],
  modoMock = false,
  grupoId?: string,
): Promise<SugerenciaDespensa[]> {
  if (modoMock) {
    await esperar(1000)
    // Mock: devolver 3 recetas genéricas
    return [
      {
        id: nuevoId(), nombre: 'Revuelto de verduras', tipo_comida: 'almuerzo',
        descripcion: 'Un revuelto rapido con lo que hay en la heladera',
        tiempo_minutos: 15, calorias: 450, porciones: perfil.personas,
        ingredientes: ingredientes.slice(0, 3).map(n => ({
          nombre: n, cantidad: 200, unidad: 'g' as const, categoria: 'verduras' as const,
        })),
        pasos: [
          { numero: 1, descripcion: 'Cortar todo en cubos' },
          { numero: 2, descripcion: 'Saltear en aceite a fuego medio' },
          { numero: 3, descripcion: 'Condimentar y servir' },
        ],
        tags: ['rapido', 'facil'],
        usa_de_despensa: ingredientes.slice(0, 3),
      },
      {
        id: nuevoId(), nombre: 'Tortilla express', tipo_comida: 'cena',
        descripcion: 'Tortilla con ingredientes de despensa',
        tiempo_minutos: 20, calorias: 520, porciones: perfil.personas,
        ingredientes: [
          { nombre: 'huevos', cantidad: 4, unidad: 'unid' as const, categoria: 'proteinas' as const },
          ...ingredientes.slice(0, 2).map(n => ({
            nombre: n, cantidad: 150, unidad: 'g' as const, categoria: 'verduras' as const,
          })),
        ],
        pasos: [
          { numero: 1, descripcion: 'Batir los huevos' },
          { numero: 2, descripcion: 'Agregar los ingredientes picados' },
          { numero: 3, descripcion: 'Cocinar en sarten a fuego bajo 10 min por lado' },
        ],
        tags: ['rapido', 'economico'],
        usa_de_despensa: ingredientes.slice(0, 2),
      },
      {
        id: nuevoId(), nombre: 'Salteado simple', tipo_comida: 'almuerzo',
        descripcion: 'Salteado rapido y nutritivo',
        tiempo_minutos: 15, calorias: 480, porciones: perfil.personas,
        ingredientes: ingredientes.slice(0, 4).map(n => ({
          nombre: n, cantidad: 180, unidad: 'g' as const, categoria: 'verduras' as const,
        })),
        pasos: [
          { numero: 1, descripcion: 'Preparar todos los ingredientes' },
          { numero: 2, descripcion: 'Saltear a fuego alto con aceite' },
          { numero: 3, descripcion: 'Servir caliente' },
        ],
        tags: ['rapido', 'saludable'],
        usa_de_despensa: ingredientes.slice(0, 4),
      },
    ]
  }

  const prompt = buildPromptConDespensa(perfil, ingredientes)
  const texto  = await callClaude(prompt, MAX_TOKENS_SUGERENCIA_DESPENSA, grupoId, 'reemplazo')
  const parsed = extraerJSON<{ sugerencias: SugerenciaDespensa[] }>(texto)

  for (const s of parsed.sugerencias) {
    s.id = nuevoId()
  }

  return parsed.sugerencias
}

export async function reemplazarComida(
  perfil:       PerfilParaPrompt,
  tipo:         TipoComida,
  recetaActual: Receta,
  otrasDelDia:  Receta[],
  modoMock = false,
  grupoId?: string,
): Promise<Receta> {
  if (modoMock) {
    await esperar(800)
    return mockReemplazo(tipo, recetaActual, otrasDelDia)
  }

  const prompt = buildPromptReemplazo(perfil, tipo, recetaActual, otrasDelDia)
  const texto  = await callClaude(prompt, MAX_TOKENS_REEMPLAZO, grupoId, 'reemplazo')
  const receta = extraerJSON<Receta>(texto)
  receta.id = nuevoId()
  return receta
}
