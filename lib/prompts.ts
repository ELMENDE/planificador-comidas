import type { Receta, TipoComida } from '@/types/menu'

// IMPORTANTE: en runtime la app usa Sonnet (mas rapido y barato).
// El desarrollo del proyecto usa Opus pero eso no aplica a esta constante.
export const MODELO_IA = 'claude-sonnet-4-5'
export const MAX_TOKENS_MENU_COMPLETO = 8000
export const MAX_TOKENS_REEMPLAZO = 1500

/**
 * Perfil "plano" que el generador y los prompts usan.
 * Se construye con grupoAPerfilHogar() desde lib/grupos.ts
 * o con perfilSoloAHogar() para usuarios sin grupo.
 */
export interface PerfilParaPrompt {
  nombre:             string
  personas:           number
  presupuesto?:       number
  restricciones:      string[]
  cocinas_preferidas: string[]
  tiempo_max_coccion: number
  tdee_total_grupo:   number   // suma de TDEE de todos los que comen
  tdee_por_persona:   number   // promedio
}

const REGLAS_COMUNES = `
REGLAS ESTRICTAS:
- Usar exclusivamente ingredientes conseguibles en supermercados de Uruguay.
- Respetar de forma absoluta las restricciones alimentarias del perfil.
- Cantidades exactas para el numero de personas indicado.
- Unidades permitidas: g, kg, ml, l, unid, taza, cdita, cda.
- Categorias permitidas: verduras, frutas, proteinas, lacteos, almacen, panaderia, condimentos.
- Responder EXCLUSIVAMENTE con JSON valido. Sin texto extra. Sin backticks. Sin explicaciones.
`.trim()

export function buildPromptMenuSemanal(perfil: PerfilParaPrompt): string {
  const restricciones = perfil.restricciones.length
    ? perfil.restricciones.join(', ')
    : 'ninguna'
  const cocinas = perfil.cocinas_preferidas.length
    ? perfil.cocinas_preferidas.join(', ')
    : 'variadas'
  const presupuesto = perfil.presupuesto
    ? `Presupuesto semanal aproximado: ${perfil.presupuesto} UYU.`
    : 'Sin limite estricto, pero cuidar el costo.'

  const tdeeTotal = perfil.tdee_total_grupo
  const tdeeProm  = perfil.tdee_por_persona

  return `
Generas un menu semanal completo (7 dias x 3 comidas = 21 recetas) para un grupo de
${perfil.personas} persona${perfil.personas > 1 ? 's' : ''}.

CRITICO: todas las cantidades de ingredientes y las porciones de cada receta deben
ser para ${perfil.personas} personas en total. Las calorias indicadas en cada receta
son el TOTAL de todas las porciones combinadas (no por persona).

- Restricciones: ${restricciones}
- Cocinas preferidas: ${cocinas}
- Tiempo max de coccion: ${perfil.tiempo_max_coccion} minutos
- ${presupuesto}

CALORIAS DEL GRUPO (Harris-Benedict revisada):
- TDEE total del grupo: ${tdeeTotal} kcal/dia
- TDEE promedio por persona: ${tdeeProm} kcal/dia
- Calorias totales por dia (las 3 comidas sumadas): ~${tdeeTotal} kcal
- Distribucion: 25% desayuno / 40% almuerzo / 35% cena
- Desayuno total: ~${Math.round(tdeeTotal * 0.25)} kcal
- Almuerzo total: ~${Math.round(tdeeTotal * 0.40)} kcal
- Cena total:     ~${Math.round(tdeeTotal * 0.35)} kcal

OBJETIVOS:
- 7 dias: Lunes, Martes, Miercoles, Jueves, Viernes, Sabado, Domingo.
- Cada dia con desayuno, almuerzo y cena distintos.
- Sin repetir el mismo plato en toda la semana.
- Maximo 2 dias seguidos con la misma proteina principal.
- Desayunos rapidos: menos de 15 minutos.
- Al menos 2 almuerzos o cenas vegetarianos en la semana.
- Reutilizar ingredientes entre dias para reducir desperdicio.

${REGLAS_COMUNES}

FORMATO (JSON):
{
  "dias": [
    {
      "dia": "Lunes",
      "desayuno": { ...receta },
      "almuerzo": { ...receta },
      "cena":     { ...receta }
    }
  ]
}

Receta (porciones SIEMPRE = ${perfil.personas}):
{
  "nombre": "string",
  "tipo_comida": "desayuno" | "almuerzo" | "cena",
  "descripcion": "string breve",
  "tiempo_minutos": number,
  "calorias": number (TOTAL para ${perfil.personas} porciones),
  "porciones": ${perfil.personas},
  "ingredientes": [
    { "nombre": "string", "cantidad": number, "unidad": "g", "categoria": "verduras" }
  ],
  "pasos": [
    { "numero": 1, "descripcion": "string" }
  ],
  "tags": ["string"]
}
`.trim()
}

export const MAX_TOKENS_SUGERENCIA_DESPENSA = 3000

export function buildPromptConDespensa(
  perfil: PerfilParaPrompt,
  ingredientesDisponibles: string[],
): string {
  const restricciones = perfil.restricciones.length
    ? perfil.restricciones.join(', ')
    : 'ninguna'

  return `
Tenes los siguientes ingredientes disponibles en tu despensa:
${ingredientesDisponibles.map(i => `- ${i}`).join('\n')}

Sugeri 3 recetas que se puedan hacer PRINCIPALMENTE con esos ingredientes.
Podes agregar hasta 3 ingredientes basicos extra por receta (sal, aceite, especias comunes, etc.)
pero el plato tiene que basarse en lo que ya hay.

- Personas: ${perfil.personas}
- Restricciones: ${restricciones}
- Tiempo maximo: ${perfil.tiempo_max_coccion} minutos
- Calorias objetivo por receta (TOTAL grupo): ~${Math.round(perfil.tdee_total_grupo * 0.35)} kcal

${REGLAS_COMUNES}

Devolve un JSON con esta estructura:
{
  "sugerencias": [
    {
      "nombre": "string",
      "tipo_comida": "almuerzo" | "cena",
      "descripcion": "string breve",
      "tiempo_minutos": number,
      "calorias": number (TOTAL para ${perfil.personas} porciones),
      "porciones": ${perfil.personas},
      "ingredientes": [
        { "nombre": "string", "cantidad": number, "unidad": "g", "categoria": "verduras" }
      ],
      "pasos": [
        { "numero": 1, "descripcion": "string" }
      ],
      "tags": ["string"],
      "usa_de_despensa": ["nombre ingrediente 1", "nombre ingrediente 2"]
    }
  ]
}
`.trim()
}

export function buildPromptReemplazo(
  perfil: PerfilParaPrompt,
  tipo: TipoComida,
  recetaActual: Receta,
  otrasDelDia: Receta[],
): string {
  const restricciones = perfil.restricciones.length
    ? perfil.restricciones.join(', ')
    : 'ninguna'
  const evitar = [recetaActual, ...otrasDelDia].map(r => r.nombre).join(', ')

  return `
Reemplaza la siguiente receta de ${tipo} por una alternativa distinta para:

- Personas: ${perfil.personas}
- Restricciones: ${restricciones}
- Tiempo maximo: ${perfil.tiempo_max_coccion} minutos
- Calorias objetivo para esta comida (TOTAL grupo): ~${recetaActual.calorias} kcal

Receta actual:
${JSON.stringify(recetaActual, null, 2)}

NO devuelvas ninguna de estas (evitar duplicados del dia): ${evitar}.

${REGLAS_COMUNES}

Devolve SOLO la nueva receta como JSON con la misma estructura.
`.trim()
}
