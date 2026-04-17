import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Button, Card, H1, Screen, Subtle } from '@/components/ui'
import { aceptarInvitacion, buscarInvitacion } from '@/lib/grupos'
import { useAppStore } from '@/store/useAppStore'
import type { Invitacion } from '@/types/menu'

/**
 * Pantalla de aceptación de invitación.
 * Se llega via deep link: planificador://invitar/{token}
 * o desde la app directamente: /invitar/{token}
 */
export default function InvitarScreen() {
  const { token } = useLocalSearchParams<{ token: string }>()
  const usuario      = useAppStore(s => s.usuario)
  const cargarGrupos = useAppStore(s => s.cargarGrupos)
  const setGrupoActivo = useAppStore(s => s.setGrupoActivo)

  const [inv, setInv]         = useState<Invitacion | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [done, setDone]       = useState(false)

  useEffect(() => {
    if (!token) return
    buscarInvitacion(token)
      .then(i => {
        if (!i) setError('Invitacion no encontrada')
        else if (i.usada) setError('Esta invitacion ya fue usada')
        else if (new Date(i.expira_at) < new Date()) setError('Invitacion expirada')
        else setInv(i)
      })
      .catch(() => setError('Error al buscar la invitacion'))
      .finally(() => setLoading(false))
  }, [token])

  async function aceptar() {
    if (!token) return
    setJoining(true); setError(null)
    try {
      const grupo = await aceptarInvitacion(token)
      await cargarGrupos()
      setGrupoActivo(grupo)
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al unirte')
    } finally {
      setJoining(false)
    }
  }

  // Si no está logueado, redirigir a login primero
  if (!usuario) {
    return (
      <Screen>
        <SafeAreaView className="flex-1 items-center justify-center p-6">
          <View className="items-center gap-4">
            <Text className="text-5xl">🔒</Text>
            <H1>Inicia sesion primero</H1>
            <Subtle className="text-center">
              Necesitas una cuenta para unirte a un grupo familiar.
            </Subtle>
            <Button
              size="lg"
              fullWidth
              onPress={() => router.replace('/auth/login')}
            >
              Ir a iniciar sesion
            </Button>
          </View>
        </SafeAreaView>
      </Screen>
    )
  }

  if (loading) {
    return (
      <Screen>
        <SafeAreaView className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#ea580c" />
          <Subtle className="mt-4">Verificando invitacion...</Subtle>
        </SafeAreaView>
      </Screen>
    )
  }

  if (done) {
    return (
      <Screen>
        <SafeAreaView className="flex-1 items-center justify-center p-6">
          <View className="items-center gap-4">
            <Text className="text-6xl">🎉</Text>
            <H1>Te uniste al grupo!</H1>
            <Subtle className="text-center">
              Ya sos parte de {inv?.grupo?.nombre ?? 'el grupo'}. Los menus se van a generar
              teniendo en cuenta tus calorias.
            </Subtle>
            <Button
              size="lg"
              fullWidth
              onPress={() => router.replace('/')}
            >
              Ir al menu
            </Button>
          </View>
        </SafeAreaView>
      </Screen>
    )
  }

  if (error && !inv) {
    return (
      <Screen>
        <SafeAreaView className="flex-1 items-center justify-center p-6">
          <View className="items-center gap-4">
            <Text className="text-5xl">😕</Text>
            <H1>Invitacion invalida</H1>
            <Subtle className="text-center">{error}</Subtle>
            <Button
              size="lg"
              fullWidth
              onPress={() => router.replace('/')}
            >
              Volver al inicio
            </Button>
          </View>
        </SafeAreaView>
      </Screen>
    )
  }

  return (
    <Screen>
      <SafeAreaView className="flex-1 items-center justify-center p-6">
        <View className="items-center gap-6 w-full max-w-sm">
          <Text className="text-6xl">👨‍👩‍👧‍👦</Text>
          <H1>Te invitaron a un grupo</H1>

          <Card elevated className="w-full">
            <View className="items-center gap-2">
              <Text className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">
                {inv?.grupo?.nombre ?? 'Grupo familiar'}
              </Text>
              <Subtle>Te invitaron a planificar comidas juntos</Subtle>
            </View>
          </Card>

          {error && (
            <View className="flex-row items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 px-3 py-2.5 w-full">
              <Ionicons name="alert-circle" size={18} color="#dc2626" />
              <Text className="flex-1 text-sm text-red-700 dark:text-red-300">{error}</Text>
            </View>
          )}

          <Button size="lg" fullWidth onPress={aceptar} loading={joining}>
            Unirme al grupo
          </Button>
          <Button variant="ghost" fullWidth onPress={() => router.back()}>
            Cancelar
          </Button>
        </View>
      </SafeAreaView>
    </Screen>
  )
}
