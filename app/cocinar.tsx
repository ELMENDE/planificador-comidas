import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Badge, Screen, Subtle } from '@/components/ui'
import { useAppStore } from '@/store/useAppStore'
import type { MiembroGrupo, TipoComida } from '@/types/menu'

/**
 * Modo cocina full-screen.
 *
 * Muestra pasos uno a uno en letra grande. Detecta "X minutos" para ofrecer
 * un timer. Si hay grupo activo, permite elegir quién come hoy y recalcula
 * las cantidades de ingredientes.
 */
export default function CocinarScreen() {
  const params   = useLocalSearchParams<{ diaIndex: string; tipo: TipoComida }>()
  const diaIndex = Number(params.diaIndex)
  const tipo     = params.tipo

  const menu        = useAppStore(s => s.menuActual)
  const grupoActivo = useAppStore(s => s.grupoActivo)

  const [pasoIdx, setPasoIdx] = useState(0)

  // Miembros que comen esta receta (por defecto: todos los activos)
  const todosActivos = useMemo(() =>
    (grupoActivo?.miembros ?? []).filter(m => m.activo),
    [grupoActivo],
  )
  const [comenIds, setComenIds] = useState<string[]>(() =>
    todosActivos.map(m => m.user_id),
  )

  function toggleCome(userId: string) {
    setComenIds(ids =>
      ids.includes(userId)
        ? ids.filter(id => id !== userId)
        : [...ids, userId],
    )
  }

  // Factor de escala: si se desmarcan miembros, reducir proporcional al TDEE
  const factorComen = useMemo(() => {
    if (todosActivos.length === 0) return 1
    const tdeeTotal   = todosActivos.reduce((s, m) => s + (m.perfil?.tdee_cache ?? 2000), 0)
    const tdeeSelec   = todosActivos
      .filter(m => comenIds.includes(m.user_id))
      .reduce((s, m) => s + (m.perfil?.tdee_cache ?? 2000), 0)
    return tdeeTotal > 0 ? tdeeSelec / tdeeTotal : 1
  }, [todosActivos, comenIds])

  // ----- Timer -----
  const [timerSegs, setTimerSegs] = useState(0)
  const [timerInicial, setTimerInicial] = useState(0)
  const [timerCorriendo, setTimerCorriendo] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (timerCorriendo && timerSegs > 0) {
      intervalRef.current = setInterval(() => {
        setTimerSegs(s => {
          if (s <= 1) {
            safeHaptic('notification')
            setTimeout(() => safeHaptic('notification'), 300)
            setTimeout(() => safeHaptic('notification'), 600)
            setTimerCorriendo(false)
            return 0
          }
          return s - 1
        })
      }, 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [timerCorriendo, timerSegs])

  if (
    !menu ||
    Number.isNaN(diaIndex) ||
    !menu.dias[diaIndex] ||
    !tipo ||
    !menu.dias[diaIndex][tipo]
  ) {
    return (
      <Screen>
        <SafeAreaView className="flex-1 items-center justify-center p-4">
          <Text className="text-neutral-700 dark:text-neutral-300 text-center mb-4">
            Receta no encontrada
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="rounded-2xl bg-brand-600 px-5 py-3"
          >
            <Text className="text-white font-bold">Volver</Text>
          </Pressable>
        </SafeAreaView>
      </Screen>
    )
  }

  const receta  = menu.dias[diaIndex][tipo]
  const pasosRaw = Array.isArray(receta.pasos) ? receta.pasos : []
  const pasos = pasosRaw.length > 0
    ? pasosRaw
    : [{ numero: 1, descripcion: receta.descripcion || 'Seguir las instrucciones de la receta.' }]
  const total     = pasos.length
  const idxSeguro = Math.min(Math.max(0, pasoIdx), total - 1)
  const paso      = pasos[idxSeguro]
  const esUltimo  = idxSeguro >= total - 1
  const esPrimero = idxSeguro === 0

  const minutosDelPaso = useMemo(() => {
    if (!paso) return null
    const match = paso.descripcion.match(/(\d+)\s*(min|minuto)/i)
    return match ? Number(match[1]) : null
  }, [paso])

  function safeHaptic(type: 'selection' | 'notification' | 'impact' = 'selection') {
    try {
      if (type === 'notification') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      else if (type === 'impact') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      else Haptics.selectionAsync()
    } catch {}
  }

  function siguiente() {
    safeHaptic()
    if (esUltimo) {
      router.back()
    } else {
      setPasoIdx(i => i + 1)
    }
  }
  function anterior() {
    safeHaptic()
    setPasoIdx(i => Math.max(0, i - 1))
  }

  function iniciarTimer(mins: number) {
    safeHaptic('impact')
    const segs = mins * 60
    setTimerInicial(segs)
    setTimerSegs(segs)
    setTimerCorriendo(true)
  }
  function pausarTimer() { setTimerCorriendo(false) }
  function reanudarTimer() { setTimerCorriendo(true) }
  function reiniciarTimer() {
    setTimerSegs(timerInicial)
    setTimerCorriendo(false)
  }
  function cerrarTimer() {
    setTimerSegs(0)
    setTimerInicial(0)
    setTimerCorriendo(false)
  }

  function fmt(s: number): string {
    const m = Math.floor(s / 60)
    const r = s % 60
    return `${m}:${String(r).padStart(2, '0')}`
  }

  function redondear(n: number): string {
    if (Number.isInteger(n)) return String(n)
    const r = Math.round(n * 10) / 10
    return Number.isInteger(r) ? String(r) : r.toFixed(1)
  }

  const progreso = ((pasoIdx + 1) / total) * 100

  return (
    <Screen>
      <SafeAreaView className="flex-1">
        {/* Header con barra de progreso */}
        <View className="px-5 pt-2 pb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              className="h-10 w-10 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 items-center justify-center"
            >
              <Ionicons name="close" size={20} color="#525252" />
            </Pressable>
            <View className="flex-1 mx-3">
              <Text className="text-center text-xs uppercase tracking-wider font-bold text-neutral-500">
                {receta.nombre}
              </Text>
            </View>
            <Badge variant="brand">{pasoIdx + 1} / {total}</Badge>
          </View>
          <View className="h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
            <View
              className="h-full bg-brand-500"
              style={{ width: `${progreso}%` }}
            />
          </View>
        </View>

        {/* Quien come hoy — solo si hay grupo con 2+ miembros */}
        {todosActivos.length > 1 && pasoIdx === 0 && (
          <View className="px-5 pb-3">
            <Text className="text-xs uppercase tracking-wider font-bold text-neutral-500 mb-2">
              Comen hoy
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {todosActivos.map(m => {
                const come = comenIds.includes(m.user_id)
                return (
                  <Pressable
                    key={m.user_id}
                    onPress={() => { safeHaptic(); toggleCome(m.user_id) }}
                    className={`flex-row items-center gap-2 rounded-full px-4 py-2 border ${
                      come
                        ? 'bg-brand-600 border-brand-600'
                        : 'bg-white dark:bg-[#15151b] border-neutral-300 dark:border-white/[0.08]'
                    }`}
                  >
                    <Text className="text-base">{m.perfil?.emoji ?? '👤'}</Text>
                    <Text className={`text-sm font-bold ${come ? 'text-white' : 'text-neutral-600 dark:text-neutral-400'}`}>
                      {m.apodo || m.perfil?.nombre || 'Miembro'}
                    </Text>
                  </Pressable>
                )
              })}
            </ScrollView>
            {factorComen < 1 && (
              <Text className="text-xs text-brand-600 mt-2">
                Cantidades ajustadas al {Math.round(factorComen * 100)}% del total
              </Text>
            )}
          </View>
        )}

        {/* Paso actual */}
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 20, justifyContent: 'center' }}
        >
          <View className="items-center mb-6">
            <View className="h-24 w-24 rounded-full bg-brand-100 dark:bg-brand-900/40 items-center justify-center mb-4">
              <Text className="text-5xl font-extrabold text-brand-700 dark:text-brand-300">
                {pasoIdx + 1}
              </Text>
            </View>
            <Subtle>Paso {pasoIdx + 1} de {total}</Subtle>
          </View>

          <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 leading-9 text-center px-2">
            {paso?.descripcion}
          </Text>

          {/* Cantidades ajustadas si hay factor diferente */}
          {factorComen < 1 && pasoIdx === 0 && (
            <View className="mt-6 bg-white dark:bg-[#15151b] border border-neutral-200 dark:border-white/[0.08] rounded-2xl p-4">
              <Text className="text-xs uppercase tracking-wider font-bold text-neutral-500 mb-2">
                Ingredientes ajustados
              </Text>
              {receta.ingredientes.map((ing, idx) => (
                <View key={idx} className="flex-row justify-between py-1">
                  <Text className="text-sm text-neutral-700 dark:text-neutral-300">{ing.nombre}</Text>
                  <Text className="text-sm font-bold text-brand-600">
                    {redondear(ing.cantidad * factorComen)} {ing.unidad}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Boton de timer detectado */}
          {minutosDelPaso !== null && timerInicial === 0 && (
            <Pressable
              onPress={() => iniciarTimer(minutosDelPaso)}
              className="mt-8 self-center flex-row items-center gap-2 rounded-full bg-brand-600 px-6 py-4"
            >
              <Ionicons name="timer-outline" size={22} color="#fff" />
              <Text className="text-white font-bold text-base">
                Iniciar timer {minutosDelPaso} min
              </Text>
            </Pressable>
          )}

          {/* Timer activo */}
          {timerInicial > 0 && (
            <View className="mt-8 self-center items-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 w-full max-w-xs">
              <Text className={`text-6xl font-extrabold ${
                timerSegs === 0
                  ? 'text-green-600'
                  : 'text-neutral-900 dark:text-neutral-100'
              }`}>
                {fmt(timerSegs)}
              </Text>
              {timerSegs === 0 && (
                <Text className="text-base font-bold text-green-600 mt-1">
                  ✓ Listo!
                </Text>
              )}
              <View className="flex-row gap-2 mt-4">
                {timerSegs > 0 && (
                  timerCorriendo ? (
                    <Pressable
                      onPress={pausarTimer}
                      className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/40 items-center justify-center"
                    >
                      <Ionicons name="pause" size={22} color="#f59e0b" />
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={reanudarTimer}
                      className="h-12 w-12 rounded-full bg-brand-600 items-center justify-center"
                    >
                      <Ionicons name="play" size={22} color="#fff" />
                    </Pressable>
                  )
                )}
                <Pressable
                  onPress={reiniciarTimer}
                  className="h-12 w-12 rounded-full bg-neutral-100 dark:bg-neutral-800 items-center justify-center"
                >
                  <Ionicons name="refresh" size={20} color="#525252" />
                </Pressable>
                <Pressable
                  onPress={cerrarTimer}
                  className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/40 items-center justify-center"
                >
                  <Ionicons name="close" size={22} color="#dc2626" />
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Botones de navegacion gigantes */}
        <View className="flex-row gap-3 px-5 pb-5">
          <Pressable
            onPress={anterior}
            disabled={esPrimero}
            className={`flex-1 flex-row items-center justify-center gap-2 rounded-2xl py-5 ${
              esPrimero
                ? 'bg-neutral-100 dark:bg-neutral-800'
                : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800'
            }`}
          >
            <Ionicons name="arrow-back" size={22} color={esPrimero ? '#9ca3af' : '#525252'} />
            <Text className={`font-bold text-base ${
              esPrimero ? 'text-neutral-400' : 'text-neutral-800 dark:text-neutral-200'
            }`}>
              Anterior
            </Text>
          </Pressable>
          <Pressable
            onPress={siguiente}
            className={`flex-[1.3] flex-row items-center justify-center gap-2 rounded-2xl py-5 ${
              esUltimo ? 'bg-green-600' : 'bg-brand-600'
            }`}
          >
            <Text className="font-bold text-white text-base">
              {esUltimo ? '✓ Listo!' : 'Siguiente'}
            </Text>
            {!esUltimo && <Ionicons name="arrow-forward" size={22} color="#fff" />}
          </Pressable>
        </View>
      </SafeAreaView>
    </Screen>
  )
}
