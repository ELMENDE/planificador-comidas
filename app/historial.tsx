import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Badge, Card, EmptyState, H1, Screen, Subtle } from '@/components/ui'
import { cargarHistorial, toggleFavoritoHistorial, type HistorialEntry } from '@/lib/sync'
import { useAppStore } from '@/store/useAppStore'

export default function HistorialScreen() {
  const grupoActivo = useAppStore(s => s.grupoActivo)
  const setMenu     = useAppStore(s => s.setMenuActual)

  const [entries, setEntries] = useState<HistorialEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery]     = useState('')
  const [soloFavs, setSoloFavs] = useState(false)

  useEffect(() => {
    if (!grupoActivo) { setLoading(false); return }
    cargarHistorial(grupoActivo.id)
      .then(setEntries)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [grupoActivo?.id])

  const filtrados = useMemo(() => {
    let result = entries
    if (soloFavs) {
      result = result.filter(e => e.favorito)
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(e =>
        e.semana?.toLowerCase().includes(q) ||
        e.menu?.dias.some(d =>
          d.desayuno.nombre.toLowerCase().includes(q) ||
          d.almuerzo.nombre.toLowerCase().includes(q) ||
          d.cena.nombre.toLowerCase().includes(q),
        ),
      )
    }
    return result
  }, [entries, query, soloFavs])

  async function toggleFav(entry: HistorialEntry) {
    const nuevoVal = !entry.favorito
    setEntries(es => es.map(e => e.id === entry.id ? { ...e, favorito: nuevoVal } : e))
    try {
      await toggleFavoritoHistorial(entry.id, nuevoVal)
    } catch {
      setEntries(es => es.map(e => e.id === entry.id ? { ...e, favorito: !nuevoVal } : e))
    }
  }

  function cargarMenu(entry: HistorialEntry) {
    if (entry.menu) {
      setMenu(entry.menu)
      router.back()
    }
  }

  return (
    <Screen>
      <SafeAreaView edges={['top']} className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Subtle>Menus pasados</Subtle>
              <H1>Historial</H1>
            </View>
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              className="h-11 w-11 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 items-center justify-center"
            >
              <Ionicons name="close" size={20} color="#525252" />
            </Pressable>
          </View>

          {!grupoActivo && (
            <EmptyState
              icon="👥"
              title="Sin grupo"
              message="Crea o unite a un grupo para ver el historial de menus."
            />
          )}

          {loading && (
            <View className="items-center py-10">
              <ActivityIndicator size="large" color="#ea580c" />
            </View>
          )}

          {!loading && grupoActivo && entries.length === 0 && (
            <EmptyState
              icon="📜"
              title="Sin historial"
              message="Los menus que generes van a aparecer aca."
            />
          )}

          {/* Search + filter */}
          {entries.length > 2 && (
            <>
              <View className="flex-row items-center bg-neutral-100 dark:bg-white/[0.06] rounded-2xl px-4 py-2.5 gap-2">
                <Ionicons name="search" size={18} color="#a3a3a3" />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Buscar por receta o semana..."
                  placeholderTextColor="#a3a3a3"
                  className="flex-1 text-sm text-neutral-900 dark:text-neutral-100"
                  autoCorrect={false}
                />
                {query.length > 0 && (
                  <Pressable onPress={() => setQuery('')} hitSlop={8}>
                    <Ionicons name="close-circle" size={18} color="#a3a3a3" />
                  </Pressable>
                )}
              </View>
              <Pressable
                onPress={() => setSoloFavs(v => !v)}
                className={`self-start flex-row items-center gap-1.5 rounded-full px-3.5 py-2 border ${
                  soloFavs
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                    : 'bg-white dark:bg-[#15151b] border-neutral-200 dark:border-white/[0.08]'
                }`}
              >
                <Ionicons
                  name={soloFavs ? 'star' : 'star-outline'}
                  size={14}
                  color={soloFavs ? '#f59e0b' : '#a3a3a3'}
                />
                <Text className={`text-xs font-semibold ${
                  soloFavs ? 'text-amber-700 dark:text-amber-300' : 'text-neutral-600 dark:text-neutral-400'
                }`}>
                  Solo favoritos
                </Text>
              </Pressable>
            </>
          )}

          {!loading && entries.length > 0 && filtrados.length === 0 && (
            <EmptyState
              icon="🔍"
              title="Sin resultados"
              message={soloFavs
                ? 'No hay menus favoritos.'
                : `No hay menus que coincidan con "${query}".`
              }
            />
          )}

          {filtrados.map(entry => (
            <Card key={entry.id} elevated>
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Text className="font-bold text-neutral-900 dark:text-neutral-100">
                      Semana del {entry.semana}
                    </Text>
                    {entry.favorito && <Badge variant="warning">★</Badge>}
                  </View>
                  <Subtle>
                    {entry.generado_at
                      ? new Date(entry.generado_at).toLocaleString('es-UY')
                      : new Date(entry.created_at).toLocaleString('es-UY')}
                  </Subtle>
                  <View className="flex-row gap-2 mt-2">
                    <Badge variant="brand">7 dias</Badge>
                    <Badge variant="neutral">21 recetas</Badge>
                    {entry.kcal && (
                      <Badge variant="neutral">{entry.kcal} kcal/dia</Badge>
                    )}
                  </View>
                </View>
                <View className="gap-2">
                  <Pressable
                    hitSlop={10}
                    onPress={() => toggleFav(entry)}
                    className="h-9 w-9 rounded-full bg-amber-50 dark:bg-amber-950/40 items-center justify-center"
                  >
                    <Ionicons
                      name={entry.favorito ? 'star' : 'star-outline'}
                      size={18}
                      color={entry.favorito ? '#f59e0b' : '#9ca3af'}
                    />
                  </Pressable>
                  {entry.menu && (
                    <Pressable
                      hitSlop={10}
                      onPress={() => cargarMenu(entry)}
                      className="h-9 w-9 rounded-full bg-brand-600 items-center justify-center"
                    >
                      <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </Pressable>
                  )}
                </View>
              </View>
            </Card>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Screen>
  )
}
