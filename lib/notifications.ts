import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import type { MenuSemanal } from '@/types/menu'

// ---- Config ----

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

// ---- Permisos ----

export async function pedirPermisoNotificaciones(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync()
  if (existing === 'granted') return true

  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

// ---- Push token (para notificaciones remotas a futuro) ----

export async function obtenerPushToken(): Promise<string | null> {
  const permiso = await pedirPermisoNotificaciones()
  if (!permiso) return null

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    })
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: undefined, // uses app.json expo.extra.eas.projectId automatically
    })
    return token.data
  } catch {
    return null
  }
}

// ---- Notificaciones locales de comida ----

const MEAL_CHANNEL = 'meal-reminders'

const HORAS_COMIDA = {
  desayuno: { hour: 8, minute: 0 },
  almuerzo: { hour: 12, minute: 0 },
  cena:     { hour: 20, minute: 0 },
} as const

/**
 * Programa notificaciones locales para toda la semana.
 * Cancela las anteriores y crea 21 nuevas (3 por dia, 7 dias).
 */
export async function programarNotificacionesMenu(menu: MenuSemanal): Promise<void> {
  const permiso = await pedirPermisoNotificaciones()
  if (!permiso) return

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(MEAL_CHANNEL, {
      name: 'Recordatorios de comida',
      importance: Notifications.AndroidImportance.DEFAULT,
    })
  }

  // Cancelar todas las notificaciones anteriores
  await Notifications.cancelAllScheduledNotificationsAsync()

  const hoy = new Date()
  const diaSemanaHoy = hoy.getDay() // 0=dom, 1=lun...

  // Mapeo de nombres de dia a offset desde hoy
  const DIAS_OFFSET: Record<string, number> = {}
  const DIAS_NOMBRES = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
  // Calcular el proximo lunes como base
  const diaActualIdx = diaSemanaHoy === 0 ? 6 : diaSemanaHoy - 1 // 0=lun
  for (let i = 0; i < 7; i++) {
    DIAS_OFFSET[DIAS_NOMBRES[i]] = i - diaActualIdx
  }

  for (const dia of menu.dias) {
    const offset = DIAS_OFFSET[dia.dia.toLowerCase()] ?? 0
    if (offset < 0) continue // Dia ya paso

    const comidas = [
      { tipo: 'desayuno' as const, receta: dia.desayuno },
      { tipo: 'almuerzo' as const, receta: dia.almuerzo },
      { tipo: 'cena' as const,     receta: dia.cena },
    ]

    for (const { tipo, receta } of comidas) {
      const hora = HORAS_COMIDA[tipo]
      const trigger = new Date()
      trigger.setDate(hoy.getDate() + offset)
      trigger.setHours(hora.hour, hora.minute, 0, 0)

      // Solo programar si es en el futuro
      if (trigger.getTime() <= Date.now()) continue

      const emoji = tipo === 'desayuno' ? '🥐' : tipo === 'almuerzo' ? '🥗' : '🍝'

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${emoji} Hora de ${tipo}`,
          body: `Hoy toca: ${receta.nombre} (${receta.tiempo_minutos} min)`,
          data: { tipo, dia: dia.dia },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: trigger,
          channelId: Platform.OS === 'android' ? MEAL_CHANNEL : undefined,
        },
      })
    }
  }
}

/** Cancela todas las notificaciones programadas (cuando se resetea el menu). */
export async function cancelarNotificacionesMenu(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync()
}
