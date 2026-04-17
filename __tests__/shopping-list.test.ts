import {
  capitalizar,
  generarListaCompras,
  keyItem,
  listaATexto,
  menuATexto,
  estadisticasMenu,
} from '@/lib/shopping-list'
import type { MenuSemanal, Receta, DiaMenu } from '@/types/menu'

// --- Helpers para crear datos de test ---

function receta(overrides: Partial<Receta> = {}): Receta {
  return {
    nombre: 'Test receta',
    tipo_comida: 'almuerzo',
    descripcion: 'desc',
    tiempo_minutos: 30,
    calorias: 500,
    porciones: 2,
    ingredientes: [
      { nombre: 'tomate', cantidad: 200, unidad: 'g', categoria: 'verduras' },
      { nombre: 'pollo', cantidad: 300, unidad: 'g', categoria: 'proteinas' },
    ],
    pasos: [{ numero: 1, descripcion: 'Cocinar' }],
    tags: [],
    ...overrides,
  }
}

function menuSimple(dias: Partial<DiaMenu>[] = []): MenuSemanal {
  const defaultDia: DiaMenu = {
    dia: 'Lunes',
    desayuno: receta({ nombre: 'Tostadas', tipo_comida: 'desayuno', calorias: 300, tiempo_minutos: 10 }),
    almuerzo: receta({ nombre: 'Pollo al horno', tipo_comida: 'almuerzo', calorias: 600 }),
    cena: receta({ nombre: 'Ensalada', tipo_comida: 'cena', calorias: 400, tags: ['vegetariano'] }),
  }

  return {
    id: 'test-1',
    generadoAt: '2026-04-12',
    dias: dias.length > 0
      ? dias.map((d, i) => ({ ...defaultDia, dia: ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'][i], ...d }))
      : [defaultDia],
  }
}

// --- Tests ---

describe('capitalizar', () => {
  it('capitaliza primera letra', () => {
    expect(capitalizar('tomate')).toBe('Tomate')
  })

  it('respeta el resto del string', () => {
    expect(capitalizar('pan integral')).toBe('Pan integral')
  })

  it('maneja string vacio', () => {
    expect(capitalizar('')).toBe('')
  })

  it('maneja string con espacios', () => {
    expect(capitalizar('  arroz')).toBe('Arroz')
  })
})

describe('generarListaCompras', () => {
  it('consolida ingredientes duplicados', () => {
    const menu = menuSimple([
      {
        desayuno: receta({
          ingredientes: [{ nombre: 'tomate', cantidad: 100, unidad: 'g', categoria: 'verduras' }],
        }),
        almuerzo: receta({
          ingredientes: [{ nombre: 'tomate', cantidad: 200, unidad: 'g', categoria: 'verduras' }],
        }),
        cena: receta({
          ingredientes: [{ nombre: 'tomate', cantidad: 150, unidad: 'g', categoria: 'verduras' }],
        }),
      },
    ])

    const lista = generarListaCompras(menu)
    const tomates = lista.filter(i => i.nombre === 'tomate')
    expect(tomates).toHaveLength(1)
    expect(tomates[0].cantidad).toBe(450)
  })

  it('normaliza kg a g', () => {
    const menu = menuSimple([
      {
        desayuno: receta({
          ingredientes: [{ nombre: 'arroz', cantidad: 1, unidad: 'kg', categoria: 'almacen' }],
        }),
        almuerzo: receta({
          ingredientes: [{ nombre: 'arroz', cantidad: 500, unidad: 'g', categoria: 'almacen' }],
        }),
        cena: receta({ ingredientes: [] }),
      },
    ])

    const lista = generarListaCompras(menu)
    const arroz = lista.find(i => i.nombre === 'arroz')
    expect(arroz).toBeDefined()
    // 1kg = 1000g + 500g = 1500g -> presentado como 1.5kg
    expect(arroz!.cantidad).toBe(1.5)
    expect(arroz!.unidad).toBe('kg')
  })

  it('marca items de despensa', () => {
    const menu = menuSimple([
      {
        desayuno: receta({
          ingredientes: [{ nombre: 'sal', cantidad: 5, unidad: 'g', categoria: 'condimentos' }],
        }),
        almuerzo: receta({ ingredientes: [] }),
        cena: receta({ ingredientes: [] }),
      },
    ])

    const lista = generarListaCompras(menu, [{ id: '1', nombre: 'sal', unidad: 'g' }])
    const sal = lista.find(i => i.nombre === 'sal')
    expect(sal?.en_despensa).toBe(true)
  })

  it('ordena por categoria', () => {
    const menu = menuSimple([
      {
        desayuno: receta({
          ingredientes: [
            { nombre: 'sal', cantidad: 5, unidad: 'g', categoria: 'condimentos' },
            { nombre: 'lechuga', cantidad: 100, unidad: 'g', categoria: 'verduras' },
          ],
        }),
        almuerzo: receta({ ingredientes: [] }),
        cena: receta({ ingredientes: [] }),
      },
    ])

    const lista = generarListaCompras(menu)
    const idxLechuga = lista.findIndex(i => i.nombre === 'lechuga')
    const idxSal = lista.findIndex(i => i.nombre === 'sal')
    // verduras antes que condimentos
    expect(idxLechuga).toBeLessThan(idxSal)
  })

  it('devuelve lista vacia con menu sin ingredientes', () => {
    const menu = menuSimple([
      {
        desayuno: receta({ ingredientes: [] }),
        almuerzo: receta({ ingredientes: [] }),
        cena: receta({ ingredientes: [] }),
      },
    ])
    expect(generarListaCompras(menu)).toHaveLength(0)
  })
})

describe('keyItem', () => {
  it('genera clave unica por nombre y unidad', () => {
    const item = { nombre: 'Tomate', cantidad: 200, unidad: 'g' as const, categoria: 'verduras' as const, en_despensa: false, tildado: false }
    expect(keyItem(item)).toBe('tomate__g')
  })
})

describe('listaATexto', () => {
  it('genera texto con categorias y emojis', () => {
    const items = [
      { nombre: 'tomate', cantidad: 500, unidad: 'g' as const, categoria: 'verduras' as const, en_despensa: false, tildado: false },
      { nombre: 'pollo', cantidad: 1, unidad: 'kg' as const, categoria: 'proteinas' as const, en_despensa: false, tildado: false },
    ]
    const texto = listaATexto(items)
    expect(texto).toContain('Lista de compras')
    expect(texto).toContain('VERDURAS')
    expect(texto).toContain('Tomate')
    expect(texto).toContain('PROTEINAS')
    expect(texto).toContain('Pollo')
  })

  it('excluye items de despensa', () => {
    const items = [
      { nombre: 'sal', cantidad: 5, unidad: 'g' as const, categoria: 'condimentos' as const, en_despensa: true, tildado: false },
    ]
    const texto = listaATexto(items)
    expect(texto).not.toContain('Sal')
  })
})

describe('menuATexto', () => {
  it('incluye todos los dias y recetas', () => {
    const menu = menuSimple([
      { dia: 'Lunes' },
    ])
    const texto = menuATexto(menu)
    expect(texto).toContain('Menu semanal')
    expect(texto).toContain('LUNES')
    expect(texto).toContain('Tostadas')
    expect(texto).toContain('Pollo al horno')
    expect(texto).toContain('Ensalada')
    expect(texto).toContain('Healthwise')
  })
})

describe('estadisticasMenu', () => {
  it('calcula calorias promedio diario', () => {
    // 7 dias identicos: 300+600+400 = 1300/dia
    const dias = Array(7).fill(null).map((_, i) => ({
      dia: ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'][i],
    }))
    const menu = menuSimple(dias)
    const stats = estadisticasMenu(menu)
    expect(stats.caloriasPromedioDiario).toBe(Math.round(1300))
  })

  it('cuenta platos vegetarianos', () => {
    const dias = Array(7).fill(null).map((_, i) => ({
      dia: ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'][i],
    }))
    const menu = menuSimple(dias)
    const stats = estadisticasMenu(menu)
    // Cada dia tiene 1 cena con tag 'vegetariano' => 7
    expect(stats.platosVegetarianos).toBe(7)
  })

  it('suma tiempo total', () => {
    const dias = Array(7).fill(null).map((_, i) => ({
      dia: ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'][i],
    }))
    const menu = menuSimple(dias)
    const stats = estadisticasMenu(menu)
    // Cada dia: 10+30+30 = 70 min * 7 = 490
    expect(stats.tiempoTotalMinutos).toBe(490)
  })
})
