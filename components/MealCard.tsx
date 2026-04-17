import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Image, Pressable, Text, View } from 'react-native'
import type { Receta, TipoComida } from '@/types/menu'
import { useAppStore } from '@/store/useAppStore'
import { imagenReceta } from '@/lib/recipe-images'
import { shadows } from '@/lib/theme'

interface Props {
  receta:   Receta
  tipo:     TipoComida
  diaIndex: number
}

const EMOJI: Record<TipoComida, string> = {
  desayuno: '☕',
  almuerzo: '🍽️',
  cena:     '🌙',
}

// Dark mode: fondos tenues con tintes de color en lugar de negros puros. Los
// bordes son sutiles para que los cards "flote" sobre el fondo #0b0b10.
const COLOR: Record<TipoComida, string> = {
  desayuno: 'bg-amber-50 dark:bg-amber-500/[0.08] border-amber-200 dark:border-amber-500/20',
  almuerzo: 'bg-orange-50 dark:bg-orange-500/[0.08] border-orange-200 dark:border-orange-500/20',
  cena:     'bg-indigo-50 dark:bg-indigo-500/[0.08] border-indigo-200 dark:border-indigo-500/20',
}

export default function MealCard({ receta, tipo, diaIndex }: Props) {
  const esFavorito = useAppStore(s => s.esFavoritoReceta(receta.nombre))
  const toggleFav  = useAppStore(s => s.toggleFavoritoReceta)

  const imageUri = imagenReceta(receta.nombre, 400, 200)

  return (
    <Pressable
      onPress={() => router.push({
        pathname: '/receta',
        params:   { diaIndex: String(diaIndex), tipo },
      })}
      style={shadows.sm}
      className={`rounded-2xl border overflow-hidden active:opacity-80 ${COLOR[tipo]}`}
    >
      <Image
        source={{ uri: imageUri }}
        style={{ width: '100%', height: 100 }}
        resizeMode="cover"
      />
      <View className="p-4">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-2">
            <Text className="text-[10px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400 font-bold">
              {EMOJI[tipo]}  {tipo}
            </Text>
            <Text className="text-base font-bold text-neutral-900 dark:text-neutral-100 mt-1">
              {receta.nombre}
            </Text>
            <Text className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
              ⏱ {receta.tiempo_minutos} min · 🔥 {receta.calorias} kcal
            </Text>
            {receta.tags?.length > 0 && (
              <View className="flex-row flex-wrap gap-1 mt-2">
                {receta.tags.slice(0, 3).map(t => (
                  <View key={t} className="rounded-full bg-white/70 dark:bg-white/[0.08] px-2 py-0.5">
                    <Text className="text-[10px] text-neutral-700 dark:text-neutral-300 font-semibold">
                      {t}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          <Pressable
            hitSlop={10}
            onPress={(e) => { e.stopPropagation?.(); toggleFav(receta) }}
            className="h-9 w-9 rounded-full bg-white/80 dark:bg-white/[0.08] items-center justify-center"
          >
            <Ionicons
              name={esFavorito ? 'heart' : 'heart-outline'}
              size={18}
              color={esFavorito ? '#ea580c' : '#9ca3af'}
            />
          </Pressable>
        </View>
      </View>
    </Pressable>
  )
}
