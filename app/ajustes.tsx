import { Ionicons } from '@expo/vector-icons'
import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Badge, Button, Card, Chip, H2, Screen, Subtle } from '@/components/ui'
import { cancelarNotificacionesMenu, pedirPermisoNotificaciones, programarNotificacionesMenu } from '@/lib/notifications'
import { useAppStore } from '@/store/useAppStore'

export default function AjustesScreen() {
  const tema        = useAppStore(s => s.tema)
  const setTema     = useAppStore(s => s.setTema)
  const modoMock    = useAppStore(s => s.modoMock)
  const setModoMock = useAppStore(s => s.setModoMock)
  const grupoActivo = useAppStore(s => s.grupoActivo)
  const notifComida = useAppStore(s => s.notificacionesComida)
  const setNotifComida = useAppStore(s => s.setNotificacionesComida)
  const menuActual  = useAppStore(s => s.menuActual)

  async function toggleNotificaciones() {
    if (notifComida) {
      // Desactivar
      setNotifComida(false)
      await cancelarNotificacionesMenu()
    } else {
      // Activar — pedir permiso
      const ok = await pedirPermisoNotificaciones()
      if (!ok) return
      setNotifComida(true)
      if (menuActual) {
        await programarNotificacionesMenu(menuActual)
      }
    }
  }

  return (
    <Screen>
      <SafeAreaView className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>

          {/* Modo mock destacado */}
          <Card elevated className="border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20">
            <View className="flex-row items-start gap-3">
              <View className="h-11 w-11 rounded-2xl bg-purple-100 dark:bg-purple-900/40 items-center justify-center">
                <Ionicons name="flask" size={22} color="#a855f7" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="font-bold text-neutral-900 dark:text-neutral-100">
                    Modo de prueba (Mock)
                  </Text>
                  {modoMock && <Badge variant="brand">ACTIVO</Badge>}
                </View>
                <Subtle className="mt-1">
                  Si esta activo, las generaciones devuelven datos pre-cargados.
                  No consume tokens de Claude.
                </Subtle>
                <View className="mt-3">
                  <Button
                    variant={modoMock ? 'secondary' : 'primary'}
                    size="sm"
                    onPress={() => setModoMock(!modoMock)}
                  >
                    {modoMock ? '☁️ Cambiar a modo REAL' : '🧪 Activar modo MOCK'}
                  </Button>
                </View>
              </View>
            </View>
          </Card>

          {/* Info del proxy */}
          <H2>Generacion con IA</H2>
          <Card>
            <View className="flex-row items-center gap-2 mb-2">
              <Ionicons name="shield-checkmark" size={18} color="#16a34a" />
              <Text className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Proxy seguro
              </Text>
            </View>
            <Subtle>
              Las llamadas a Claude pasan por nuestro servidor. Tu API key nunca
              sale del backend. Limite: 5 menus y 20 reemplazos por grupo por dia.
            </Subtle>
            {grupoActivo && (
              <View className="mt-2">
                <Badge variant="success">Grupo: {grupoActivo.nombre}</Badge>
              </View>
            )}
            {!grupoActivo && !modoMock && (
              <View className="mt-2 flex-row items-center gap-2">
                <Ionicons name="alert-circle" size={16} color="#f59e0b" />
                <Text className="text-xs text-amber-700 dark:text-amber-300">
                  Necesitas un grupo para generar menus con IA real.
                </Text>
              </View>
            )}
          </Card>

          <H2>Tema</H2>
          <View className="flex-row gap-2">
            <Chip label="Sistema" selected={tema === 'sistema'} onPress={() => setTema('sistema')} />
            <Chip label="Claro"   selected={tema === 'claro'}   onPress={() => setTema('claro')} />
            <Chip label="Oscuro"  selected={tema === 'oscuro'}  onPress={() => setTema('oscuro')} />
          </View>

          <H2>Notificaciones</H2>
          <Card>
            <View className="flex-row items-start gap-3">
              <View className="h-11 w-11 rounded-2xl bg-blue-100 dark:bg-blue-900/40 items-center justify-center">
                <Ionicons name="notifications" size={22} color="#3b82f6" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="font-bold text-neutral-900 dark:text-neutral-100">
                    Recordatorios de comida
                  </Text>
                  {notifComida && <Badge variant="success">ON</Badge>}
                </View>
                <Subtle className="mt-1">
                  Te avisa a las 8hs, 12hs y 20hs que toca cocinar segun tu menu semanal.
                </Subtle>
                <View className="mt-3">
                  <Button
                    variant={notifComida ? 'secondary' : 'primary'}
                    size="sm"
                    onPress={toggleNotificaciones}
                  >
                    {notifComida ? 'Desactivar' : 'Activar recordatorios'}
                  </Button>
                </View>
              </View>
            </View>
          </Card>

          <H2>Acerca de</H2>
          <Card>
            <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Healthwise de comidas
            </Text>
            <Text className="text-xs text-neutral-500 mt-0.5">v0.3.0 — grupos + sync</Text>
            <Text className="text-xs text-neutral-500 mt-3">
              Backend: Supabase · IA: Claude via Edge Function
            </Text>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </Screen>
  )
}
