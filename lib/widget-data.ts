import AsyncStorage from '@react-native-async-storage/async-storage'
import type { MenuSemanal } from '@/types/menu'

const WIDGET_KEY = 'widget_comida_hoy'

interface WidgetComidaHoy {
  dia:       string
  desayuno:  { nombre: string; calorias: number; tiempo: number }
  almuerzo:  { nombre: string; calorias: number; tiempo: number }
  cena:      { nombre: string; calorias: number; tiempo: number }
  updatedAt: string
}

const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']

/**
 * Extrae la comida de hoy del menu y la guarda en AsyncStorage
 * para que el widget nativo pueda leerla.
 */
export async function actualizarWidgetData(menu: MenuSemanal): Promise<void> {
  const hoy = DIAS_SEMANA[new Date().getDay()]
  const diaMenu = menu.dias.find(d => d.dia.toLowerCase() === hoy)

  if (!diaMenu) return

  const data: WidgetComidaHoy = {
    dia: diaMenu.dia,
    desayuno: {
      nombre:   diaMenu.desayuno.nombre,
      calorias: diaMenu.desayuno.calorias,
      tiempo:   diaMenu.desayuno.tiempo_minutos,
    },
    almuerzo: {
      nombre:   diaMenu.almuerzo.nombre,
      calorias: diaMenu.almuerzo.calorias,
      tiempo:   diaMenu.almuerzo.tiempo_minutos,
    },
    cena: {
      nombre:   diaMenu.cena.nombre,
      calorias: diaMenu.cena.calorias,
      tiempo:   diaMenu.cena.tiempo_minutos,
    },
    updatedAt: new Date().toISOString(),
  }

  await AsyncStorage.setItem(WIDGET_KEY, JSON.stringify(data))
}

/** Lee los datos del widget (para testing o debug). */
export async function leerWidgetData(): Promise<WidgetComidaHoy | null> {
  const raw = await AsyncStorage.getItem(WIDGET_KEY)
  if (!raw) return null
  return JSON.parse(raw)
}
