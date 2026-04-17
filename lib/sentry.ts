/**
 * Sentry — crash reporting y error tracking
 *
 * Uso:
 *   import { capturarError, capturarMensaje, setSentryUsuario, limpiarSentryUsuario } from '@/lib/sentry'
 *
 * Configuración: agregar EXPO_PUBLIC_SENTRY_DSN al .env
 * Obtener DSN en: https://sentry.io → Settings → Projects → tu proyecto → Client Keys
 */

import * as Sentry from '@sentry/react-native'

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN

let inicializado = false

/** Inicializar Sentry. Llamar una sola vez al arrancar la app. */
export function inicializarSentry() {
  if (!DSN || inicializado) return

  Sentry.init({
    dsn: DSN,
    // Solo mandar eventos en producción
    enabled: !__DEV__,
    // Tasa de muestreo para performance (0.0 – 1.0)
    tracesSampleRate: 0.2,
    // Entorno
    environment: __DEV__ ? 'development' : 'production',
    // Versión de la app
    release: 'healthwise@0.1.0',
    // Ignorar errores conocidos / no accionables
    ignoreErrors: [
      'Network request failed',
      'NetworkError',
      'AbortError',
    ],
  })

  inicializado = true
}

/** Registrar el usuario en Sentry (tras login). */
export function setSentryUsuario(id: string, email?: string) {
  Sentry.setUser({ id, email })
}

/** Limpiar usuario (tras logout). */
export function limpiarSentryUsuario() {
  Sentry.setUser(null)
}

/** Capturar un error de JS (equivale a try/catch + report). */
export function capturarError(error: unknown, contexto?: Record<string, unknown>) {
  if (!inicializado) {
    if (__DEV__) console.error('[Sentry mock]', error)
    return
  }

  if (contexto) {
    Sentry.withScope(scope => {
      Object.entries(contexto).forEach(([key, val]) => scope.setExtra(key, val))
      Sentry.captureException(error)
    })
  } else {
    Sentry.captureException(error)
  }
}

/** Capturar un mensaje informativo (no error). */
export function capturarMensaje(
  mensaje: string,
  nivel: Sentry.SeverityLevel = 'info',
) {
  if (!inicializado) return
  Sentry.captureMessage(mensaje, nivel)
}

/** HOC para envolver la raíz de la app con el error boundary de Sentry. */
export const SentryErrorBoundary = Sentry.ErrorBoundary

/** Navegación: integrar con expo-router para breadcrumbs de navegación. */
export const SentryRoutingInstrumentation = Sentry.ReactNavigationInstrumentation
