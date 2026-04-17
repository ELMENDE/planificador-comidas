import { escalarReceta } from '@/lib/menu-generator'
import type { Receta } from '@/types/menu'

const recetaBase: Receta = {
  nombre: 'Pollo al horno',
  tipo_comida: 'almuerzo',
  descripcion: 'Pollo con papas',
  tiempo_minutos: 45,
  calorias: 600,
  porciones: 2,
  ingredientes: [
    { nombre: 'pollo', cantidad: 500, unidad: 'g', categoria: 'proteinas' },
    { nombre: 'papa', cantidad: 400, unidad: 'g', categoria: 'verduras' },
    { nombre: 'aceite', cantidad: 2, unidad: 'cda', categoria: 'condimentos' },
  ],
  pasos: [
    { numero: 1, descripcion: 'Precalentar horno' },
    { numero: 2, descripcion: 'Cocinar 45 min' },
  ],
  tags: ['facil'],
}

describe('escalarReceta', () => {
  it('no modifica si mismas porciones', () => {
    const result = escalarReceta(recetaBase, 2)
    expect(result).toBe(recetaBase) // misma referencia
  })

  it('duplica cantidades para 4 personas (de 2)', () => {
    const result = escalarReceta(recetaBase, 4)
    expect(result.porciones).toBe(4)
    expect(result.calorias).toBe(1200)
    expect(result.ingredientes[0].cantidad).toBe(1000) // 500 * 2
    expect(result.ingredientes[1].cantidad).toBe(800)  // 400 * 2
  })

  it('reduce cantidades para 1 persona (de 2)', () => {
    const result = escalarReceta(recetaBase, 1)
    expect(result.porciones).toBe(1)
    expect(result.calorias).toBe(300)
    expect(result.ingredientes[0].cantidad).toBe(250) // 500 / 2
  })

  it('maneja porciones fraccionarias', () => {
    const result = escalarReceta(recetaBase, 3)
    expect(result.porciones).toBe(3)
    expect(result.calorias).toBe(900) // 600 * 1.5
    expect(result.ingredientes[0].cantidad).toBe(750) // 500 * 1.5
  })

  it('no modifica la receta original', () => {
    escalarReceta(recetaBase, 4)
    expect(recetaBase.porciones).toBe(2)
    expect(recetaBase.calorias).toBe(600)
    expect(recetaBase.ingredientes[0].cantidad).toBe(500)
  })

  it('preserva datos no escalables', () => {
    const result = escalarReceta(recetaBase, 4)
    expect(result.nombre).toBe('Pollo al horno')
    expect(result.tiempo_minutos).toBe(45)
    expect(result.pasos).toHaveLength(2)
    expect(result.tags).toEqual(['facil'])
  })

  it('maneja receta con porciones 0 (fallback a 2)', () => {
    const sinPorciones = { ...recetaBase, porciones: 0 }
    const result = escalarReceta(sinPorciones, 4)
    // 0 || 2 = 2, factor = 4/2 = 2
    expect(result.calorias).toBe(1200)
  })
})
