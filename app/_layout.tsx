import { Ionicons } from '@expo/vector-icons'
import { useFonts } from 'expo-font'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useColorScheme as useNwColorScheme } from 'nativewind'
import { useEffect } from 'react'
import { ActivityIndicator, View, useColorScheme } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import '../global.css'

import OfflineBanner from '@/components/OfflineBanner'
import { sesionActual } from '@/lib/auth'
import { inicializarSentry, setSentryUsuario, limpiarSentryUsuario } from '@/lib/sentry'
import { useAppStore } from '@/store/useAppStore'

// Inicializar Sentry lo antes posible
inicializarSentry()

export default function RootLayout() {
  // Preload de fuentes de iconos para que no se descarguen desde Metro en runtime
  // (arregla "Unable to download asset ... Ionicons.ttf").
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  })

  const tema       = useAppStore(s => s.tema)
  const sistema    = useColorScheme()
  const esOscuro   = tema === 'oscuro' || (tema === 'sistema' && sistema === 'dark')

  // Forzar el colorScheme de NativeWind segun la preferencia guardada.
  // NativeWind v4 NO respeta automaticamente el toggle "claro/oscuro"; hay que
  // empujar el modo manualmente con setColorScheme cada vez que cambia.
  const { setColorScheme } = useNwColorScheme()
  useEffect(() => {
    setColorScheme(
      tema === 'claro'  ? 'light' :
      tema === 'oscuro' ? 'dark'  : 'system',
    )
  }, [tema, setColorScheme])

  const usuario     = useAppStore(s => s.usuario)
  const authReady   = useAppStore(s => s.authReady)
  const setUsuario  = useAppStore(s => s.setUsuario)
  const setReady    = useAppStore(s => s.setAuthReady)

  const router   = useRouter()
  const segments = useSegments()

  const cargarPerfil         = useAppStore(s => s.cargarPerfil)
  const cargarGrupos         = useAppStore(s => s.cargarGrupos)
  const cargarDatosGrupo     = useAppStore(s => s.cargarDatosGrupo)
  const cargarFavoritosRemoto = useAppStore(s => s.cargarFavoritosRemoto)
  const grupoActivo          = useAppStore(s => s.grupoActivo)

  // Carga sesion al arrancar
  useEffect(() => {
    sesionActual()
      .then(u => {
        setUsuario(u)
        if (u) {
          // Registrar usuario en Sentry para contexto en crash reports
          setSentryUsuario(u.id, u.email)
          Promise.all([
            cargarPerfil(),
            cargarGrupos(),
            cargarFavoritosRemoto(),
          ]).catch(() => {})
        }
      })
      .finally(() => setReady(true))
  }, [])

  // Cuando hay grupo activo (restaurado de cache o recién seleccionado),
  // cargar datos remotos y activar suscripciones realtime.
  useEffect(() => {
    if (authReady && usuario && grupoActivo) {
      cargarDatosGrupo()
    }
  }, [authReady, usuario, grupoActivo?.id])

  const perfil = useAppStore(s => s.perfil)

  // Gating: auth + onboarding
  useEffect(() => {
    if (!authReady) return
    const enAuth       = segments[0] === 'auth'
    const enOnboarding = segments[0] === 'onboarding'

    if (!usuario && !enAuth) {
      router.replace('/auth/login')
    } else if (usuario && enAuth) {
      router.replace('/')
    } else if (usuario && perfil && !perfil.onboarding_ok && !enOnboarding && !enAuth) {
      // Usuario logueado pero no hizo onboarding — forzar
      router.replace('/onboarding')
    }
  }, [authReady, usuario, perfil?.onboarding_ok, segments])

  if (!authReady || !fontsLoaded) {
    return (
      <View style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: esOscuro ? '#0b0b10' : '#fafafa',
      }}>
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={esOscuro ? 'light' : 'dark'} />
        <OfflineBanner />
        <Stack
          screenOptions={{
            headerShown: false,
            // Swipe-right desde cualquier borde para volver (estilo iOS nativo)
            gestureEnabled: true,
            fullScreenGestureEnabled: true,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)"     />
          <Stack.Screen name="auth"       />
          <Stack.Screen
            name="onboarding"
            options={{
              presentation: 'fullScreenModal',
              gestureEnabled: false,
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="ajustes"
            options={{ headerShown: true, title: 'Ajustes', presentation: 'modal' }}
          />
          <Stack.Screen name="historial"  options={{ headerShown: true, title: 'Historial' }} />
          <Stack.Screen name="favoritos"  options={{ headerShown: true, title: 'Favoritos' }} />
          <Stack.Screen
            name="receta"
            options={{ headerShown: true, title: 'Receta', presentation: 'modal' }}
          />
          <Stack.Screen
            name="cocinar"
            options={{
              headerShown: false,
              presentation: 'fullScreenModal',
              gestureEnabled: true,
              fullScreenGestureEnabled: true,
            }}
          />
          <Stack.Screen name="admin"      options={{ headerShown: false }} />
          <Stack.Screen
            name="invitar/[token]"
            options={{ headerShown: false, presentation: 'modal' }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
