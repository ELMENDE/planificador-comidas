import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Badge, Card, EmptyState, H1, Screen, Subtle } from '@/components/ui'
import { useAppStore } from '@/store/useAppStore'

export default function FavoritosScreen() {
  const favoritos = useAppStore(s => s.favoritos)
  const toggleFav = useAppStore(s => s.toggleFavoritoReceta)
  const [query, setQuery] = useState('')

  const filtrados = useMemo(() => {
    if (!query.trim()) return favoritos
    const q = query.toLowerCase()
    return favoritos.filter(r =>
      r.nombre.toLowerCase().includes(q) ||
      r.tipo_comida.toLowerCase().includes(q) ||
      r.tags?.some(t => t.toLowerCase().includes(q)),
    )
  }, [favoritos, query])

  return (
    <Screen>
      <SafeAreaView edges={['top']} className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Subtle>Las que mas te gustan</Subtle>
              <H1>Favoritos</H1>
            </View>
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              className="h-11 w-11 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 items-center justify-center"
            >
              <Ionicons name="close" size={20} color="#525252" />
            </Pressable>
          </View>

          {favoritos.length > 3 && (
            <View className="flex-row items-center bg-neutral-100 dark:bg-white/[0.06] rounded-2xl px-4 py-2.5 gap-2">
              <Ionicons name="search" size={18} color="#a3a3a3" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Buscar receta..."
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
          )}

          {favoritos.length === 0 ? (
            <EmptyState
              icon="💖"
              title="Sin favoritos"
              message="Toca el corazon en cualquier receta para guardarla aca."
            />
          ) : filtrados.length === 0 ? (
            <EmptyState
              icon="🔍"
              title="Sin resultados"
              message={`No hay favoritos que coincidan con "${query}".`}
            />
          ) : (
            filtrados.map(r => (
              <Card key={r.id ?? r.nombre} elevated>
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Badge variant="brand">{r.tipo_comida}</Badge>
                      {r.tags?.includes('vegetariano') && <Badge variant="success">veg</Badge>}
                    </View>
                    <Text className="font-bold text-neutral-900 dark:text-neutral-100 text-base">
                      {r.nombre}
                    </Text>
                    <View className="flex-row gap-3 mt-1.5">
                      <View className="flex-row items-center gap-1">
                        <Ionicons name="time-outline" size={14} color="#737373" />
                        <Subtle>{r.tiempo_minutos} min</Subtle>
                      </View>
                      <View className="flex-row items-center gap-1">
                        <Ionicons name="flame-outline" size={14} color="#737373" />
                        <Subtle>{r.calorias} kcal</Subtle>
                      </View>
                    </View>
                    {r.descripcion ? (
                      <Text className="text-xs text-neutral-600 dark:text-neutral-400 mt-2">
                        {r.descripcion}
                      </Text>
                    ) : null}
                  </View>
                  <Pressable
                    hitSlop={10}
                    onPress={() => toggleFav(r)}
                    className="h-9 w-9 rounded-full bg-red-50 dark:bg-red-950/40 items-center justify-center"
                  >
                    <Ionicons name="heart" size={18} color="#ea580c" />
                  </Pressable>
                </View>
              </Card>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Screen>
  )
}
