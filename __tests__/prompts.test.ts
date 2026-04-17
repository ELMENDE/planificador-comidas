import {
  buildPromptMenuSemanal,
  buildPromptReemplazo,
  buildPromptConDespensa,
  type PerfilParaPrompt,
} from '@/lib/prompts'

const perfilBase: PerfilParaPrompt = {
  nombre: 'Test',
  personas: 2,
  restricciones: ['celiaco'],
  cocinas_preferidas: ['italiana'],
  tiempo_max_coccion: 45,
  tdee_total_grupo: 4000,
  tdee_por_persona: 2000,
}

describe('buildPromptMenuSemanal', () => {
  it('incluye numero de personas', () => {
    const prompt = buildPromptMenuSemanal(perfilBase)
    expect(prompt).toContain('2 personas')
  })

  it('incluye restricciones', () => {
    const prompt = buildPromptMenuSemanal(perfilBase)
    expect(prompt).toContain('celiaco')
  })

  it('incluye cocinas preferidas', () => {
    const prompt = buildPromptMenuSemanal(perfilBase)
    expect(prompt).toContain('italiana')
  })

  it('incluye TDEE total del grupo', () => {
    const prompt = buildPromptMenuSemanal(perfilBase)
    expect(prompt).toContain('4000')
  })

  it('incluye distribucion 25/40/35', () => {
    const prompt = buildPromptMenuSemanal(perfilBase)
    expect(prompt).toContain(String(Math.round(4000 * 0.25))) // 1000
    expect(prompt).toContain(String(Math.round(4000 * 0.40))) // 1600
    expect(prompt).toContain(String(Math.round(4000 * 0.35))) // 1400
  })

  it('incluye tiempo max de coccion', () => {
    const prompt = buildPromptMenuSemanal(perfilBase)
    expect(prompt).toContain('45 minutos')
  })

  it('pide 7 dias x 3 comidas', () => {
    const prompt = buildPromptMenuSemanal(perfilBase)
    expect(prompt).toContain('7 dias')
    expect(prompt).toContain('Lunes')
    expect(prompt).toContain('Domingo')
  })

  it('incluye reglas de JSON', () => {
    const prompt = buildPromptMenuSemanal(perfilBase)
    expect(prompt).toContain('JSON valido')
    expect(prompt).toContain('Sin backticks')
  })

  it('porciones = personas', () => {
    const prompt = buildPromptMenuSemanal(perfilBase)
    expect(prompt).toContain('"porciones": 2')
  })

  it('maneja sin restricciones', () => {
    const prompt = buildPromptMenuSemanal({ ...perfilBase, restricciones: [] })
    expect(prompt).toContain('ninguna')
  })

  it('maneja sin cocinas preferidas', () => {
    const prompt = buildPromptMenuSemanal({ ...perfilBase, cocinas_preferidas: [] })
    expect(prompt).toContain('variadas')
  })

  it('incluye presupuesto si se define', () => {
    const prompt = buildPromptMenuSemanal({ ...perfilBase, presupuesto: 5000 })
    expect(prompt).toContain('5000 UYU')
  })
})

describe('buildPromptReemplazo', () => {
  const recetaActual = {
    id: '1',
    nombre: 'Milanesas',
    tipo_comida: 'almuerzo' as const,
    descripcion: 'desc',
    tiempo_minutos: 30,
    calorias: 600,
    porciones: 2,
    ingredientes: [],
    pasos: [],
    tags: [],
  }

  it('incluye tipo de comida', () => {
    const prompt = buildPromptReemplazo(perfilBase, 'almuerzo', recetaActual, [])
    expect(prompt).toContain('almuerzo')
  })

  it('incluye nombre de receta a evitar', () => {
    const prompt = buildPromptReemplazo(perfilBase, 'almuerzo', recetaActual, [])
    expect(prompt).toContain('Milanesas')
  })

  it('incluye calorias objetivo', () => {
    const prompt = buildPromptReemplazo(perfilBase, 'almuerzo', recetaActual, [])
    expect(prompt).toContain('600')
  })

  it('incluye restricciones', () => {
    const prompt = buildPromptReemplazo(perfilBase, 'almuerzo', recetaActual, [])
    expect(prompt).toContain('celiaco')
  })

  it('evita recetas del mismo dia', () => {
    const otra = { ...recetaActual, nombre: 'Ensalada cesar' }
    const prompt = buildPromptReemplazo(perfilBase, 'almuerzo', recetaActual, [otra])
    expect(prompt).toContain('Ensalada cesar')
  })
})

describe('buildPromptConDespensa', () => {
  it('incluye ingredientes disponibles', () => {
    const prompt = buildPromptConDespensa(perfilBase, ['arroz', 'pollo', 'cebolla'])
    expect(prompt).toContain('arroz')
    expect(prompt).toContain('pollo')
    expect(prompt).toContain('cebolla')
  })

  it('pide 3 recetas', () => {
    const prompt = buildPromptConDespensa(perfilBase, ['arroz'])
    expect(prompt).toContain('3 recetas')
  })

  it('limita ingredientes extra a 3', () => {
    const prompt = buildPromptConDespensa(perfilBase, ['arroz'])
    expect(prompt).toContain('3 ingredientes basicos extra')
  })

  it('incluye restricciones', () => {
    const prompt = buildPromptConDespensa(perfilBase, ['arroz'])
    expect(prompt).toContain('celiaco')
  })

  it('incluye calorias objetivo por receta', () => {
    const prompt = buildPromptConDespensa(perfilBase, ['arroz'])
    // 35% de 4000 = 1400
    expect(prompt).toContain('1400')
  })
})
