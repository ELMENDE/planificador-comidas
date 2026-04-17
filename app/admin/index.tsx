import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Pressable, ScrollView, Text, View } from 'react-native'

import { Card, H2, Screen, Subtle } from '@/components/ui'
import { useAppStore } from '@/store/useAppStore'

export default function AdminDashboard() {
  const usuario   = useAppStore(s => s.usuario)
  const favoritos = useAppStore(s => s.favoritos)
  const modoMock  = useAppStore(s => s.modoMock)
  const grupos    = useAppStore(s => s.grupos)

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
        <Card elevated>
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 rounded-2xl bg-brand-100 items-center justify-center">
              <Text className="text-2xl">👤</Text>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                Hola {usuario?.nombre}
              </Text>
              <Subtle>Tu cuenta</Subtle>
            </View>
          </View>
        </Card>

        <H2>Resumen</H2>
        <View className="flex-row flex-wrap gap-3">
          <StatCard icon="people"     label="Grupos"    value={String(grupos.length)}    color="#ea580c" />
          <StatCard icon="heart"      label="Favoritos" value={String(favoritos.length)} color="#dc2626" />
          <StatCard
            icon={modoMock ? 'flask' : 'cloud'}
            label="Modo IA"
            value={modoMock ? 'Mock' : 'Real'}
            color={modoMock ? '#a855f7' : '#0ea5e9'}
          />
        </View>

        <H2>Acciones rapidas</H2>
        <Card className="p-0">
          <ActionRow
            icon="settings"
            label="Ajustes"
            onPress={() => router.push('/ajustes')}
          />
          <ActionRow
            icon="exit"
            label="Volver a la app"
            onPress={() => router.replace('/')}
            last
          />
        </Card>

        <Card>
          <H2>Tu cuenta</H2>
          <View className="mt-2 gap-1">
            <Text className="text-sm text-neutral-700 dark:text-neutral-300">
              📧 {usuario?.email}
            </Text>
            <Text className="text-sm text-neutral-700 dark:text-neutral-300">
              🆔 {usuario?.id}
            </Text>
            <Text className="text-sm text-neutral-700 dark:text-neutral-300">
              📅 Miembro desde {usuario && new Date(usuario.createdAt).toLocaleDateString('es-UY')}
            </Text>
          </View>
        </Card>
      </ScrollView>
    </Screen>
  )
}

function StatCard({ icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <Card className="flex-1 min-w-[45%]" elevated>
      <View className="flex-row items-center gap-2 mb-1">
        <Ionicons name={icon} size={16} color={color} />
        <Text className="text-xs uppercase text-neutral-500 dark:text-neutral-400 font-semibold">
          {label}
        </Text>
      </View>
      <Text className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">
        {value}
      </Text>
    </Card>
  )
}

function ActionRow({ icon, label, onPress, last }: { icon: any; label: string; onPress: () => void; last?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 px-4 py-4 active:bg-neutral-50 dark:active:bg-neutral-800 ${
        last ? '' : 'border-b border-neutral-100 dark:border-neutral-800'
      }`}
    >
      <View className="h-9 w-9 rounded-xl bg-brand-50 dark:bg-brand-900/40 items-center justify-center">
        <Ionicons name={icon} size={18} color="#ea580c" />
      </View>
      <Text className="flex-1 text-base text-neutral-900 dark:text-neutral-100 font-medium">
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
    </Pressable>
  )
}
