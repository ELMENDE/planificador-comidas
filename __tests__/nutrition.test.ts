import { calcularBMR, calcularTDEE, factorActividad } from '@/lib/nutrition'

describe('calcularBMR', () => {
  it('calcula BMR masculino correctamente (Harris-Benedict revisada)', () => {
    // Hombre 30 anos, 80kg, 180cm
    // 88.362 + 13.397*80 + 4.799*180 - 5.677*30
    const esperado = 88.362 + 13.397 * 80 + 4.799 * 180 - 5.677 * 30
    expect(calcularBMR('masculino', 80, 180, 30)).toBeCloseTo(esperado, 2)
  })

  it('calcula BMR femenino correctamente', () => {
    // Mujer 25 anos, 60kg, 165cm
    // 447.593 + 9.247*60 + 3.098*165 - 4.330*25
    const esperado = 447.593 + 9.247 * 60 + 3.098 * 165 - 4.330 * 25
    expect(calcularBMR('femenino', 60, 165, 25)).toBeCloseTo(esperado, 2)
  })

  it('BMR masculino es mayor que femenino con mismos datos', () => {
    const m = calcularBMR('masculino', 70, 175, 30)
    const f = calcularBMR('femenino', 70, 175, 30)
    expect(m).toBeGreaterThan(f)
  })

  it('BMR disminuye con la edad', () => {
    const joven = calcularBMR('masculino', 75, 175, 20)
    const mayor = calcularBMR('masculino', 75, 175, 50)
    expect(joven).toBeGreaterThan(mayor)
  })

  it('BMR aumenta con mas peso', () => {
    const liviano = calcularBMR('masculino', 60, 175, 30)
    const pesado  = calcularBMR('masculino', 90, 175, 30)
    expect(pesado).toBeGreaterThan(liviano)
  })
})

describe('factorActividad', () => {
  it('sedentario = 1.2', () => {
    expect(factorActividad('sedentario')).toBe(1.2)
  })

  it('moderado = 1.55', () => {
    expect(factorActividad('moderado')).toBe(1.55)
  })

  it('muy_intenso = 1.9', () => {
    expect(factorActividad('muy_intenso')).toBe(1.9)
  })

  it('factores estan en orden creciente', () => {
    const niveles = ['sedentario', 'ligero', 'moderado', 'intenso', 'muy_intenso'] as const
    const factores = niveles.map(factorActividad)
    for (let i = 1; i < factores.length; i++) {
      expect(factores[i]).toBeGreaterThan(factores[i - 1])
    }
  })
})

describe('calcularTDEE', () => {
  const bioBase = {
    sexo: 'masculino' as const,
    edad: 30,
    peso_kg: 75,
    altura_cm: 175,
    actividad: 'moderado' as const,
  }

  it('calcula TDEE = BMR * factor actividad (sin objetivo)', () => {
    const bmr = calcularBMR('masculino', 75, 175, 30)
    const esperado = Math.round(bmr * 1.55)
    expect(calcularTDEE(bioBase)).toBe(esperado)
  })

  it('objetivo perder resta 400 kcal', () => {
    const mantener = calcularTDEE(bioBase)
    const perder   = calcularTDEE({ ...bioBase, objetivo: 'perder' })
    expect(perder).toBe(mantener - 400)
  })

  it('objetivo ganar suma 300 kcal', () => {
    const mantener = calcularTDEE(bioBase)
    const ganar    = calcularTDEE({ ...bioBase, objetivo: 'ganar' })
    expect(ganar).toBe(mantener + 300)
  })

  it('objetivo mantener no modifica', () => {
    const sinObj  = calcularTDEE(bioBase)
    const conObj  = calcularTDEE({ ...bioBase, objetivo: 'mantener' })
    expect(conObj).toBe(sinObj)
  })

  it('devuelve un numero entero (redondeado)', () => {
    const tdee = calcularTDEE(bioBase)
    expect(Number.isInteger(tdee)).toBe(true)
  })

  it('TDEE esta en rango razonable (1200-4500)', () => {
    const tdee = calcularTDEE(bioBase)
    expect(tdee).toBeGreaterThan(1200)
    expect(tdee).toBeLessThan(4500)
  })
})
