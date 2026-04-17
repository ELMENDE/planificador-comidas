import { Ionicons } from '@expo/vector-icons'
import Constants from 'expo-constants'
import { Alert, Platform, ScrollView, Text, View } from 'react-native'

import { Badge, Button, Card, H2, Screen, Subtle } from '@/components/ui'
import { MODELO_IA } from '@/lib/prompts'
import { useAppStore } from '@/store/useAppStore'

export default function AdminSistema() {
  const modoMock    = useAppStore(s => s.modoMock)
  const setModoMock = useAppStore(s => s.setModoMock)
  const setUsuario  = useAppStore(s => s.setUsuario)
  const resetTodo   = useAppStore(s => s.resetTodo)

  function confirmarResetTotal() {
    Alert.alert(
      'Reset completo',
      'Borra TODOS los datos locales: menus, favoritos, despensa. Tu cuenta en Supabase no se borra. Estas seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar todo', style: 'destructive',
          onPress: () => {
            resetTodo()
            setUsuario(null)
          },
        },
      ],
    )
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
        <H2>Modo de generacion</H2>
        <Card>
          <View className="flex-row items-start gap-3">
            <View className="h-10 w-10 rounded-xl bg-brand-50 dark:bg-brand-900/40 items-center justify-center">
              <Ionicons name={modoMock ? 'flask' : 'cloud'} size={20} color="#ea580c" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-neutral-900 dark:text-neutral-100">
                {modoMock ? 'Modo MOCK activo' : 'Modo REAL activo'}
              </Text>
              <Subtle className="mt-1">
                {modoMock
                  ? 'Las generaciones devuelven datos pre-cargados. No consume tokens.'
                  : 'Las generaciones pasan por el proxy seguro de Supabase Edge Functions.'}
              </Subtle>
              <View className="mt-3">
                <Button
                  variant={modoMock ? 'primary' : 'secondary'}
                  size="sm"
                  onPress={() => setModoMock(!modoMock)}
                >
                  {modoMock ? '☁️ Cambiar a modo REAL' : '🧪 Cambiar a modo MOCK'}
                </Button>
              </View>
            </View>
          </View>
        </Card>

        <H2>Generacion con IA</H2>
        <Card>
          <View className="flex-row items-center gap-2 mb-2">
            <Ionicons name="shield-checkmark" size={18} color="#16a34a" />
            <Text className="font-semibold text-neutral-900 dark:text-neutral-100">
              Proxy seguro activo
            </Text>
          </View>
          <Subtle>
            La API key de Anthropic esta en el servidor (Supabase Edge Function).
            Limite: 5 menus / 20 reemplazos por grupo por dia.
          </Subtle>
          <View className="mt-2">
            <Badge variant="success">Edge Function: claude-proxy</Badge>
          </View>
        </Card>

        <H2>Info del entorno</H2>
        <Card className="p-0">
          <Row label="Modelo IA"     value={MODELO_IA} />
          <Row label="Plataforma"    value={`${Platform.OS} ${Platform.Version}`} />
          <Row label="Expo SDK"      value={Constants.expoConfig?.sdkVersion ?? '52'} />
          <Row label="App version"   value={Constants.expoConfig?.version ?? '0.3.0'} />
          <Row label="Backend"       value="Supabase + Edge Functions" last />
        </Card>

        <H2>Zona peligrosa</H2>
        <Card className="border-red-300 bg-red-50 dark:bg-red-950/30">
          <Text className="text-sm text-red-800 dark:text-red-200 mb-3">
            Esta accion borra todos los datos locales y te desloguea.
            Tu cuenta y grupos en Supabase no se borran.
          </Text>
          <Button variant="danger" onPress={confirmarResetTotal}>
            Reset total del sistema
          </Button>
        </Card>
      </ScrollView>
    </Screen>
  )
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View className={`flex-row items-center justify-between px-4 py-3 ${
      last ? '' : 'border-b border-neutral-100 dark:border-neutral-800'
    }`}>
      <Text className="text-sm text-neutral-600 dark:text-neutral-400">{label}</Text>
      <Text className="text-sm font-mono text-neutral-900 dark:text-neutral-100">{value}</Text>
    </View>
  )
}
