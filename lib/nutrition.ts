import type { DatosBiometricos, NivelActividad, Sexo } from '@/types/menu'

/**
 * Harris-Benedict revisada (Roza & Shizgal 1984).
 * Devuelve el metabolismo basal (BMR) en kcal/dia.
 *
 *   hombre:  88.362 + (13.397 * kg) + (4.799 * cm) - (5.677 * edad)
 *   mujer:   447.593 + (9.247  * kg) + (3.098 * cm) - (4.330 * edad)
 */
export function calcularBMR(
  sexo:      Sexo,
  peso_kg:   number,
  altura_cm: number,
  edad:      number,
): number {
  if (sexo === 'masculino') {
    return 88.362 + 13.397 * peso_kg + 4.799 * altura_cm - 5.677 * edad
  }
  return 447.593 + 9.247 * peso_kg + 3.098 * altura_cm - 4.330 * edad
}

/** Factor de actividad (TDEE = BMR * factor). */
export function factorActividad(a: NivelActividad): number {
  switch (a) {
    case 'sedentario':  return 1.2
    case 'ligero':      return 1.375
    case 'moderado':    return 1.55
    case 'intenso':     return 1.725
    case 'muy_intenso': return 1.9
  }
}

/** Total Daily Energy Expenditure — lo que gasta en total por dia. */
export function calcularTDEE(bio: DatosBiometricos): number {
  const bmr  = calcularBMR(bio.sexo, bio.peso_kg, bio.altura_cm, bio.edad)
  const tdee = bmr * factorActividad(bio.actividad)
  const ajuste =
    bio.objetivo === 'perder' ? -400 :
    bio.objetivo === 'ganar'  ? +300 :
    0
  return Math.round(tdee + ajuste)
}

export const ETIQUETAS_ACTIVIDAD: Record<NivelActividad, string> = {
  sedentario:  'Sedentario (oficina, nada de ejercicio)',
  ligero:      'Ligero (1-3 dias/semana)',
  moderado:    'Moderado (3-5 dias/semana)',
  intenso:     'Intenso (6-7 dias/semana)',
  muy_intenso: 'Muy intenso (deportista / doble turno)',
}
