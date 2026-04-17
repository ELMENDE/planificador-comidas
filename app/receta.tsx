import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import LoadingOverlay from '@/components/LoadingOverlay'
import { Badge, Button, Card, H1, H2, Screen, Subtle } from '@/components/ui'
import { imagenReceta } from '@/lib/recipe-images'
import { grupoAPerfilHogar, perfilSoloAHogar } from '@/lib/grupos'
import { reemplazarComida } from '@/lib/menu-generator'
import { useAppStore } from '@/store/useAppStore'
import type { MiembroGrupo, TipoComida } from '@/types/menu'

export default function RecetaScreen() {
  const params   = useLocalSearchParams<{ diaIndex: string; tipo: TipoComida }>()
  const diaIndex = Number(params.diaIndex)
  const tipo     = params.tipo

  const menu        = useAppStore(s => s.menuActual)
  const perfil      = useAppStore(s => s.perfil)
  const grupoActivo = useAppStore(s => s.grupoActivo)
  const reemplazar  = useAppStore(s => s.reemplazarReceta)
  const toggleFav   = useAppStore(s => s.toggleFavoritoReceta)
  const esFav       = useAppStore(s => s.esFavoritoReceta)
  const modoMock    = useAppStore(s => s.modoMock)

  const [loading, setLoading] = useState(false)

  // Ajuste de porciones en vivo
  const porcionesBase = menu?.dias[diaIndex]?.[tipo]?.porciones ?? 1
  const [porcionesElegidas, setPorcionesElegidas] = useState(porcionesBase)
  const factor = porcionesElegidas / porcionesBase

  // Miembros del grupo para mostrar kcal individuales
  const miembrosActivos: MiembroGrupo[] = grupoActivo
    ? (grupoActivo.miembros ?? []).filter(m => m.activo)
    : []

  function redondear(n: number): string {
    if (Number.isInteger(n)) return String(n)
    const r = Math.round(n * 10) / 10
    return Number.isInteger(r) ? String(r) : r.toFixed(1)
  }

  if (!menu || !menu.dias[diaIndex]) {
    return (
      <Screen>
        <SafeAreaView className="flex-1 items-center justify-center p-4">
          <Text>Receta no encontrada</Text>
        </SafeAreaView>
      </Screen>
    )
  }

  const dia    = menu.dias[diaIndex]
  const receta = dia[tipo]

  // Calcular kcal por miembro proporcional a su TDEE
  function kcalPorMiembro(miembro: MiembroGrupo): number {
    if (miembrosActivos.length === 0) return receta.calorias * factor
    const tdeeTotal = miembrosActivos.reduce((s, m) => s + (m.perfil?.tdee_cache ?? 2000), 0)
    const tdeeEste  = miembro.perfil?.tdee_cache ?? 2000
    return Math.round((receta.calorias * factor * tdeeEste) / tdeeTotal)
  }

  function buildPerfilPrompt() {
    if (grupoActivo) return grupoAPerfilHogar(grupoActivo)
    if (perfil) return perfilSoloAHogar(perfil)
    return null
  }

  async function hacerReemplazo() {
    const pp = buildPerfilPrompt()
    if (!pp) return
    setLoading(true)
    try {
      const otras = [dia.desayuno, dia.almuerzo, dia.cena].filter(r => r.tipo_comida !== tipo)
      const nueva = await reemplazarComida(pp, tipo, receta, otras, modoMock, grupoActivo?.id)
      reemplazar(tipo, diaIndex, nueva)
      Alert.alert('Listo', `Nuevo plato: ${nueva.nombre}`)
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo reemplazar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen>
      <SafeAreaView className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>

          {/* Imagen de la receta */}
          <View className="rounded-2xl overflow-hidden -mx-4 -mt-4 mb-2">
            <Image
              source={{ uri: imagenReceta(receta.nombre, 800, 400) }}
              style={{ width: '100%', height: 180 }}
              resizeMode="cover"
            />
          </View>

          {/* Header */}
          <View>
            <View className="flex-row items-center gap-2 mb-2">
              <Badge variant="brand">{dia.dia}</Badge>
              <Badge>{tipo}</Badge>
            </View>
            <View className="flex-row items-start justify-between gap-2">
              <View className="flex-1">
                <H1>{receta.nombre}</H1>
                <Subtle className="mt-1">
                  ⏱ {receta.tiempo_minutos} min · 🔥 {Math.round(receta.calorias * factor)} kcal · 👥 {porcionesElegidas} {porcionesElegidas === 1 ? 'porcion' : 'porciones'}
                </Subtle>
              </View>
              <Pressable
                hitSlop={10}
                onPress={() => toggleFav(receta)}
                className="h-12 w-12 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 items-center justify-center"
              >
                <Ionicons
                  name={esFav(receta.nombre) ? 'heart' : 'heart-outline'}
                  size={24}
                  color={esFav(receta.nombre) ? '#ea580c' : '#9ca3af'}
                />
              </Pressable>
            </View>
          </View>

          <Text className="text-base text-neutral-700 dark:text-neutral-300 leading-6">
            {receta.descripcion}
          </Text>

          {receta.tags?.length > 0 && (
            <View className="flex-row flex-wrap gap-1.5">
              {receta.tags.map(t => (
                <Badge key={t} variant="brand">{t}</Badge>
              ))}
            </View>
          )}

          {/* Stepper de porciones */}
          <Card elevated>
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Cocinar para
                </Text>
                <Subtle>Recalcula cantidades en vivo</Subtle>
              </View>
              <View className="flex-row items-center gap-3">
                <Pressable
                  onPress={() => setPorcionesElegidas(p => Math.max(1, p - 1))}
                  disabled={porcionesElegidas <= 1}
                  className={`h-10 w-10 rounded-full items-center justify-center ${
                    porcionesElegidas <= 1
                      ? 'bg-neutral-100 dark:bg-neutral-800'
                      : 'bg-brand-100 dark:bg-brand-900/40'
                  }`}
                >
                  <Ionicons name="remove" size={20} color={porcionesElegidas <= 1 ? '#9ca3af' : '#ea580c'} />
                </Pressable>
                <Text className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100 w-8 text-center">
                  {porcionesElegidas}
                </Text>
                <Pressable
                  onPress={() => setPorcionesElegidas(p => Math.min(20, p + 1))}
                  className="h-10 w-10 rounded-full bg-brand-100 dark:bg-brand-900/40 items-center justify-center"
                >
                  <Ionicons name="add" size={20} color="#ea580c" />
                </Pressable>
              </View>
            </View>
            {porcionesElegidas !== porcionesBase && (
              <Pressable
                onPress={() => setPorcionesElegidas(porcionesBase)}
                className="mt-3 self-start"
              >
                <Text className="text-xs text-brand-600 font-semibold">
                  ↺ Volver al original ({porcionesBase})
                </Text>
              </Pressable>
            )}
          </Card>

          {/* Calorias por miembro del grupo */}
          {miembrosActivos.length > 1 && (
            <Card>
              <Text className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-3">
                🔥 Calorias por persona
              </Text>
              <View className="gap-2">
                {miembrosActivos.map(m => (
                  <View key={m.user_id} className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-lg">{m.perfil?.emoji ?? '👤'}</Text>
                      <Text className="text-sm text-neutral-800 dark:text-neutral-200">
                        {m.apodo || m.perfil?.nombre || 'Miembro'}
                      </Text>
                    </View>
                    <Text className="text-sm font-bold text-brand-600">
                      {kcalPorMiembro(m)} kcal
                    </Text>
                  </View>
                ))}
              </View>
              <Subtle className="mt-2 text-xs">
                Proporcional al TDEE individual de cada miembro.
              </Subtle>
            </Card>
          )}

          <H2>🥕 Ingredientes</H2>
          <Card className="p-0">
            {receta.ingredientes.map((i, idx) => {
              const cant = i.cantidad * factor
              return (
                <View
                  key={`${i.nombre}-${idx}`}
                  className={`flex-row justify-between items-center px-4 py-3 ${
                    idx !== receta.ingredientes.length - 1
                      ? 'border-b border-neutral-100 dark:border-neutral-800'
                      : ''
                  }`}
                >
                  <Text className="flex-1 text-base text-neutral-900 dark:text-neutral-100">
                    {i.nombre}
                  </Text>
                  <Text className={`text-sm font-mono ${
                    factor !== 1
                      ? 'text-brand-600 font-bold'
                      : 'text-neutral-500'
                  }`}>
                    {redondear(cant)} {i.unidad}
                  </Text>
                </View>
              )
            })}
          </Card>

          <H2>👨‍🍳 Pasos</H2>
          <View className="gap-2">
            {receta.pasos.map(p => (
              <Card key={p.numero} className="flex-row gap-3">
                <View className="h-8 w-8 rounded-full bg-brand-100 dark:bg-brand-900/40 items-center justify-center">
                  <Text className="text-brand-700 dark:text-brand-300 font-extrabold text-sm">
                    {p.numero}
                  </Text>
                </View>
                <Text className="flex-1 text-base text-neutral-800 dark:text-neutral-200 leading-6">
                  {p.descripcion}
                </Text>
              </Card>
            ))}
          </View>

          <Button
            size="lg"
            onPress={() => router.push({
              pathname: '/cocinar',
              params:   { diaIndex: String(diaIndex), tipo },
            })}
          >
            👨‍🍳 Empezar a cocinar
          </Button>
          <Button variant="outline" onPress={hacerReemplazo} loading={loading}>
            🔄 Reemplazar este plato
          </Button>
          <Button variant="ghost" onPress={() => router.back()}>
            Cerrar
          </Button>
        </ScrollView>
      </SafeAreaView>

      <LoadingOverlay visible={loading} mensaje="Buscando alternativa…" />
    </Screen>
  )
}
