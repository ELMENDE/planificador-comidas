import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { BackHandler, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Button, Chip, H1, Input, Screen, Subtle } from '@/components/ui'
import { registrarEvento, EVENTOS } from '@/lib/analytics'
import { calcularTDEE, ETIQUETAS_ACTIVIDAD } from '@/lib/nutrition'
import { useAppStore } from '@/store/useAppStore'
import type { NivelActividad, Objetivo, Sexo } from '@/types/menu'

const RESTRICCIONES = [
  'vegetariano', 'vegano', 'celiaco', 'sin_lactosa',
  'sin_frutos_secos', 'diabetico',
]

const NIVELES_ACTIVIDAD: NivelActividad[] = [
  'sedentario', 'ligero', 'moderado', 'intenso', 'muy_intenso',
]

function toNum(s: string, fallback: number): number {
  if (s.trim() === '') return fallback
  const n = Number(s)
  return Number.isFinite(n) ? n : fallback
}

/**
 * Onboarding personal — solo datos bio del usuario.
 * Ya no pregunta nada de grupo familiar (eso se crea después en Perfil).
 *
 * 3 pasos:
 *   1. Datos físicos (sexo, edad, peso, altura)
 *   2. Actividad + objetivo
 *   3. Restricciones alimentarias personales
 */
export default function OnboardingScreen() {
  const usuario       = useAppStore(s => s.usuario)
  const guardarPerfil = useAppStore(s => s.guardarPerfil)
  const [paso, setPaso] = useState(0)
  const [loading, setLoading] = useState(false)

  // Boton atras de Android: navega al paso anterior igual que el swipe de iPhone.
  // En el paso 0 no hay paso anterior, se bloquea (no tiene sentido salir sin completar).
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (paso > 0) {
        setPaso(p => p - 1)
        return true // manejado: volver al paso anterior
      }
      return true // paso 0: bloquear salida del onboarding
    })
    return () => sub.remove()
  }, [paso])

  // Paso 1
  const [sexo,   setSexo]   = useState<Sexo>('masculino')
  const [edad,   setEdad]   = useState('30')
  const [peso,   setPeso]   = useState('75')
  const [altura, setAltura] = useState('175')

  // Paso 2
  const [actividad, setActividad] = useState<NivelActividad>('moderado')
  const [objetivo,  setObjetivo]  = useState<Objetivo>('mantener')

  // Paso 3
  const [restricciones, setRestricciones] = useState<string[]>([])

  function toggleR(v: string) {
    setRestricciones(r =>
      r.includes(v) ? r.filter(x => x !== v) : [...r, v],
    )
  }

  const tdeePreview = calcularTDEE({
    sexo,
    edad:      toNum(edad, 30),
    peso_kg:   toNum(peso, 75),
    altura_cm: toNum(altura, 175),
    actividad,
    objetivo,
  })

  async function finalizar() {
    setLoading(true)
    try {
      registrarEvento(EVENTOS.ONBOARDING_FIN, {
        tiene_restricciones: restricciones.length > 0,
        objetivo,
        actividad,
      })
      await guardarPerfil({
        nombre:        usuario?.nombre ?? '',
        sexo,
        edad:          toNum(edad, 30),
        peso_kg:       toNum(peso, 75),
        altura_cm:     toNum(altura, 175),
        actividad,
        objetivo,
        restricciones,
        tdee_cache:    tdeePreview,
        onboarding_ok: true,
      })
      router.replace('/')
    } catch (e) {
      // Si falla, dejamos que el usuario reintente
      setLoading(false)
    }
  }

  const total = 3
  const progreso = ((paso + 1) / total) * 100

  return (
    <Screen>
      <SafeAreaView className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 24, gap: 20, paddingBottom: 40 }}>

          {/* Progreso */}
          <View>
            <View className="h-1.5 bg-neutral-200 dark:bg-white/[0.08] rounded-full overflow-hidden">
              <View className="h-full bg-brand-500" style={{ width: `${progreso}%` }} />
            </View>
            <Text className="text-xs text-neutral-500 mt-2">Paso {paso + 1} de {total}</Text>
          </View>

          <View>
            <Text className="text-5xl mb-2">
              {paso === 0 ? '💪' : paso === 1 ? '🎯' : '🚫'}
            </Text>
            <H1>
              {paso === 0 ? `¡Hola${usuario?.nombre ? `, ${usuario.nombre}` : ''}!`
              : paso === 1 ? 'Tu objetivo'
              :              '¿Algo a evitar?'}
            </H1>
            <Subtle className="mt-1">
              {paso === 0 && 'Contanos sobre vos para calcular tus calorias objetivo.'}
              {paso === 1 && 'Definí tu nivel de actividad y qué querés lograr.'}
              {paso === 2 && 'Marcá restricciones alimentarias que apliquen a vos.'}
            </Subtle>
          </View>

          {/* ------- Paso 0: datos físicos ------- */}
          {paso === 0 && (
            <View className="gap-4">
              <View>
                <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Sexo biologico
                </Text>
                <View className="flex-row gap-2">
                  <Chip label="Masculino" selected={sexo === 'masculino'} onPress={() => setSexo('masculino')} />
                  <Chip label="Femenino"  selected={sexo === 'femenino'}  onPress={() => setSexo('femenino')}  />
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Input label="Edad" value={edad} onChangeText={setEdad} keyboardType="number-pad" placeholder="30" />
                </View>
                <View className="flex-1">
                  <Input label="Peso (kg)" value={peso} onChangeText={setPeso} keyboardType="number-pad" placeholder="75" />
                </View>
                <View className="flex-1">
                  <Input label="Altura (cm)" value={altura} onChangeText={setAltura} keyboardType="number-pad" placeholder="175" />
                </View>
              </View>

              <Button onPress={() => setPaso(1)} size="lg" fullWidth>Siguiente →</Button>
            </View>
          )}

          {/* ------- Paso 1: actividad + objetivo ------- */}
          {paso === 1 && (
            <View className="gap-4">
              <View>
                <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Actividad fisica
                </Text>
                <View className="gap-2">
                  {NIVELES_ACTIVIDAD.map(a => (
                    <Pressable
                      key={a}
                      onPress={() => setActividad(a)}
                      className={`rounded-2xl px-4 py-3 border ${
                        actividad === a
                          ? 'bg-brand-600 border-brand-600'
                          : 'bg-white dark:bg-[#15151b] border-neutral-300 dark:border-white/[0.08]'
                      }`}
                    >
                      <Text className={`text-sm font-semibold ${
                        actividad === a ? 'text-white' : 'text-neutral-800 dark:text-neutral-200'
                      }`}>
                        {ETIQUETAS_ACTIVIDAD[a]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View>
                <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Objetivo
                </Text>
                <View className="flex-row gap-2">
                  <Chip label="Perder peso"  selected={objetivo === 'perder'}   onPress={() => setObjetivo('perder')}   />
                  <Chip label="Mantener"     selected={objetivo === 'mantener'} onPress={() => setObjetivo('mantener')} />
                  <Chip label="Ganar masa"   selected={objetivo === 'ganar'}    onPress={() => setObjetivo('ganar')}    />
                </View>
              </View>

              {/* Preview TDEE */}
              <View className="rounded-2xl bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-900/40 p-4">
                <Text className="text-xs uppercase tracking-wider text-brand-700 dark:text-brand-300 font-bold mb-1">
                  Tu objetivo calorico
                </Text>
                <Text className="text-3xl font-extrabold text-brand-700 dark:text-brand-200">
                  {tdeePreview} kcal/dia
                </Text>
                <Text className="text-xs text-brand-700/80 dark:text-brand-300/80 mt-1">
                  Calculado con Harris-Benedict revisada.
                </Text>
              </View>

              <View className="flex-row gap-2 mt-2">
                <View className="flex-1"><Button variant="secondary" onPress={() => setPaso(0)}>← Atras</Button></View>
                <View className="flex-1"><Button onPress={() => setPaso(2)}>Siguiente →</Button></View>
              </View>
            </View>
          )}

          {/* ------- Paso 2: restricciones ------- */}
          {paso === 2 && (
            <View className="gap-4">
              <View className="flex-row flex-wrap gap-2">
                {RESTRICCIONES.map(r => (
                  <Chip
                    key={r}
                    label={r.replace('_', ' ')}
                    selected={restricciones.includes(r)}
                    onPress={() => toggleR(r)}
                  />
                ))}
              </View>

              <Subtle>
                Estas restricciones aplican a vos. Si creás un grupo familiar, podrás elegir cuáles se aplican a todos.
              </Subtle>

              <View className="flex-row gap-2 mt-4">
                <View className="flex-1"><Button variant="secondary" onPress={() => setPaso(1)}>← Atras</Button></View>
                <View className="flex-1">
                  <Button onPress={finalizar} loading={loading}>✨ Empezar</Button>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Screen>
  )
}
