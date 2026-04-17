import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useState } from 'react'
import { Alert, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import LoadingOverlay from '@/components/LoadingOverlay'
import { Badge, Button, Card, EmptyState, H1, H2, Input, Screen, Subtle } from '@/components/ui'
import { grupoAPerfilHogar, perfilSoloAHogar } from '@/lib/grupos'
import { sugerirConDespensa, type SugerenciaDespensa } from '@/lib/menu-generator'
import { useAppStore } from '@/store/useAppStore'
import type { ItemDespensa, Unidad } from '@/types/menu'

const UNIDADES: Unidad[] = ['g', 'kg', 'ml', 'l', 'unid', 'taza', 'cdita', 'cda']

export default function DespensaScreen() {
  const despensa        = useAppStore(s => s.despensa)
  const agregarDespensa = useAppStore(s => s.agregarDespensa)
  const quitarDespensa  = useAppStore(s => s.quitarDespensa)
  const grupoActivo     = useAppStore(s => s.grupoActivo)
  const perfil          = useAppStore(s => s.perfil)
  const modoMock        = useAppStore(s => s.modoMock)

  const [nombre,   setNombre]   = useState('')
  const [cantidad, setCantidad] = useState('')
  const [unidad,   setUnidad]   = useState<Unidad>('unid')

  // Sugerencias "que cocino"
  const [sugerencias, setSugerencias] = useState<SugerenciaDespensa[]>([])
  const [loadSug,     setLoadSug]     = useState(false)

  function agregar() {
    const n = nombre.trim()
    if (!n) return
    const item: ItemDespensa = {
      id:       `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      nombre:   n,
      cantidad: cantidad ? Number(cantidad) : undefined,
      unidad,
    }
    agregarDespensa(item)
    setNombre(''); setCantidad('')
  }

  function buildPerfilPrompt() {
    if (grupoActivo) return grupoAPerfilHogar(grupoActivo)
    if (perfil) return perfilSoloAHogar(perfil)
    return null
  }

  async function queCocino() {
    const pp = buildPerfilPrompt()
    if (!pp) {
      Alert.alert('Sin perfil', 'Configura tu perfil primero')
      return
    }
    if (despensa.length === 0) {
      Alert.alert('Despensa vacia', 'Agrega ingredientes primero')
      return
    }

    setLoadSug(true)
    try {
      const ingredientes = despensa.map(d => d.nombre)
      const result = await sugerirConDespensa(pp, ingredientes, modoMock, grupoActivo?.id)
      setSugerencias(result)
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudieron generar sugerencias')
    } finally {
      setLoadSug(false)
    }
  }

  return (
    <Screen>
      <SafeAreaView edges={['top']} className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
          <View className="flex-row items-end justify-between">
            <View className="flex-1">
              <Subtle>En tu casa</Subtle>
              <H1>Despensa</H1>
            </View>
            {despensa.length > 0 && (
              <Badge variant="brand">{despensa.length} items</Badge>
            )}
          </View>
          <Subtle>
            Lo que ya tenes en casa se descuenta visualmente de la lista de compras.
          </Subtle>

          <H2>Agregar item</H2>
          <Card elevated className="gap-3">
            <Input
              label="Nombre"
              value={nombre}
              onChangeText={setNombre}
              placeholder="ej: arroz"
            />
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Input
                  label="Cantidad"
                  value={cantidad}
                  onChangeText={setCantidad}
                  keyboardType="numeric"
                  placeholder="500"
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Unidad
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-1">
                    {UNIDADES.map(u => (
                      <Pressable
                        key={u}
                        onPress={() => setUnidad(u)}
                        className={`rounded-lg px-3 py-2 border ${
                          unidad === u
                            ? 'bg-brand-600 border-brand-600'
                            : 'bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700'
                        }`}
                      >
                        <Text className={`text-xs ${
                          unidad === u ? 'text-white' : 'text-neutral-700 dark:text-neutral-300'
                        }`}>{u}</Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
            <Button onPress={agregar}>Agregar a despensa</Button>
          </Card>

          {despensa.length === 0 ? (
            <EmptyState
              icon="📦"
              title="Despensa vacia"
              message="Agrega lo que ya tenes para no comprarlo de nuevo."
            />
          ) : (
            <>
              <H2>Tu inventario</H2>
              <Card elevated className="p-0">
                {despensa.map((it, idx) => (
                  <View
                    key={it.id}
                    className={`flex-row items-center gap-3 px-4 py-3 ${
                      idx !== despensa.length - 1 ? 'border-b border-neutral-100 dark:border-neutral-800' : ''
                    }`}
                  >
                    <View className="h-9 w-9 rounded-full bg-brand-50 dark:bg-brand-900/30 items-center justify-center">
                      <Ionicons name="cube-outline" size={18} color="#ea580c" />
                    </View>
                    <Text className="flex-1 font-semibold text-neutral-900 dark:text-neutral-100">
                      {it.nombre}
                    </Text>
                    {it.cantidad ? (
                      <Badge variant="neutral">{it.cantidad} {it.unidad}</Badge>
                    ) : null}
                    <Pressable
                      onPress={() => quitarDespensa(it.id)}
                      hitSlop={10}
                      className="h-8 w-8 rounded-full bg-red-50 dark:bg-red-950/40 items-center justify-center"
                    >
                      <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    </Pressable>
                  </View>
                ))}
              </Card>

              {/* Boton "Que cocino?" */}
              <Button
                onPress={queCocino}
                loading={loadSug}
                size="lg"
              >
                🧊 Que cocino con lo que tengo?
              </Button>
            </>
          )}

          {/* Sugerencias */}
          {sugerencias.length > 0 && (
            <>
              <H2>Sugerencias con tu despensa</H2>
              {sugerencias.map(s => (
                <Card key={s.id} elevated>
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 mb-1">
                        <Badge variant="brand">{s.tipo_comida}</Badge>
                        {s.tags?.includes('rapido') && <Badge variant="success">rapido</Badge>}
                      </View>
                      <Text className="font-bold text-neutral-900 dark:text-neutral-100 text-base">
                        {s.nombre}
                      </Text>
                      <Text className="text-xs text-neutral-500 mt-1">{s.descripcion}</Text>
                      <View className="flex-row gap-3 mt-2">
                        <View className="flex-row items-center gap-1">
                          <Ionicons name="time-outline" size={14} color="#737373" />
                          <Subtle>{s.tiempo_minutos} min</Subtle>
                        </View>
                        <View className="flex-row items-center gap-1">
                          <Ionicons name="flame-outline" size={14} color="#737373" />
                          <Subtle>{s.calorias} kcal</Subtle>
                        </View>
                      </View>
                      {s.usa_de_despensa?.length > 0 && (
                        <View className="flex-row flex-wrap gap-1 mt-2">
                          {s.usa_de_despensa.map(i => (
                            <View
                              key={i}
                              className="flex-row items-center gap-1 bg-green-50 dark:bg-green-950/30 rounded-full px-2.5 py-1"
                            >
                              <Ionicons name="checkmark-circle" size={12} color="#16a34a" />
                              <Text className="text-xs font-medium text-green-700 dark:text-green-300">
                                {i}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                    <Pressable
                      hitSlop={10}
                      onPress={() => router.push({
                        pathname: '/receta',
                        params: {
                          receta: JSON.stringify(s),
                          diaIndex: '0',
                          tipo: s.tipo_comida,
                        },
                      })}
                      className="h-9 w-9 rounded-full bg-brand-600 items-center justify-center"
                    >
                      <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </Pressable>
                  </View>
                </Card>
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      <LoadingOverlay
        visible={loadSug}
        mensaje={modoMock ? 'Buscando recetas mock...' : 'La IA busca recetas con tu despensa...'}
      />
    </Screen>
  )
}
