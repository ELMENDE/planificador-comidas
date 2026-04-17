import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useState } from 'react'
import { Modal, Pressable, ScrollView, Share, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import DayView from '@/components/DayView'
import LoadingOverlay from '@/components/LoadingOverlay'
import { Badge, Button, Card, EmptyState, H1, H2, Screen, Subtle } from '@/components/ui'
import { grupoAPerfilHogar, perfilSoloAHogar } from '@/lib/grupos'
import { generarMenuSemanal } from '@/lib/menu-generator'
import { estadisticasMenu, menuATexto } from '@/lib/shopping-list'
import { useAppStore } from '@/store/useAppStore'

export default function MenuScreen() {
  const usuario        = useAppStore(s => s.usuario)
  const perfil         = useAppStore(s => s.perfil)
  const grupos         = useAppStore(s => s.grupos)
  const grupoActivo    = useAppStore(s => s.grupoActivo)
  const setGrupoActivo = useAppStore(s => s.setGrupoActivo)
  const menu           = useAppStore(s => s.menuActual)
  const setMenu        = useAppStore(s => s.setMenuActual)
  const modoMock       = useAppStore(s => s.modoMock)

  const [load,  setLoad]     = useState(false)
  const [error, setError]    = useState<string | null>(null)
  const [diaActivo, setDia]  = useState(0)
  const [showGrupoPicker, setShowGrupoPicker] = useState(false)

  // Construir el perfil para el prompt: grupo activo o perfil individual
  function buildPerfilPrompt() {
    if (grupoActivo) return grupoAPerfilHogar(grupoActivo)
    if (perfil) return perfilSoloAHogar(perfil)
    return null
  }

  async function generar() {
    const pp = buildPerfilPrompt()
    if (!pp) {
      setError('Configura tu perfil primero')
      return
    }
    setLoad(true); setError(null)
    try {
      const m = await generarMenuSemanal(pp, modoMock, grupoActivo?.id)
      setMenu(m)
      setDia(0)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error generando menu')
    } finally {
      setLoad(false)
    }
  }

  const stats = menu ? estadisticasMenu(menu) : null
  const nombreGrupo = grupoActivo?.nombre
  const miembrosActivos = (grupoActivo?.miembros ?? []).filter(m => m.activo)

  return (
    <Screen>
      <SafeAreaView edges={['top']} className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>

          {/* Header */}
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Subtle>👋 Hola {usuario?.nombre}</Subtle>
              {grupos.length > 1 ? (
                <Pressable
                  onPress={() => setShowGrupoPicker(true)}
                  className="flex-row items-center gap-1"
                >
                  <H1>{nombreGrupo ? nombreGrupo : 'Tu menu'}</H1>
                  <Ionicons name="chevron-down" size={20} color="#a3a3a3" />
                </Pressable>
              ) : (
                <H1>{nombreGrupo ? nombreGrupo : 'Tu menu'}</H1>
              )}
            </View>
            <View className="flex-row gap-2">
              {menu && (
                <IconBtn
                  icon="share-outline"
                  onPress={() => Share.share({ message: menuATexto(menu) })}
                />
              )}
              <IconBtn icon="time-outline"     onPress={() => router.push('/historial')} />
              <IconBtn icon="heart-outline"    onPress={() => router.push('/favoritos')} />
              <IconBtn icon="settings-outline" onPress={() => router.push('/ajustes')} />
            </View>
          </View>

          {/* Grupo activo badge */}
          {grupoActivo && miembrosActivos.length > 0 && (
            <Card className="flex-row items-center gap-3">
              <View className="flex-row -space-x-1">
                {miembrosActivos.slice(0, 5).map(m => (
                  <View
                    key={m.user_id}
                    className="h-8 w-8 rounded-full bg-brand-100 dark:bg-brand-900/40 items-center justify-center border-2 border-white dark:border-[#0b0b10]"
                  >
                    <Text className="text-sm">{m.perfil?.emoji ?? '👤'}</Text>
                  </View>
                ))}
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  {miembrosActivos.length} persona{miembrosActivos.length > 1 ? 's' : ''} comiendo
                </Text>
                <Text className="text-xs text-neutral-500">
                  {miembrosActivos.reduce((s, m) => s + (m.perfil?.tdee_cache ?? 2000), 0)} kcal/dia total
                </Text>
              </View>
            </Card>
          )}

          {/* Sin grupo ni perfil */}
          {!grupoActivo && !perfil && (
            <Card className="border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
              <View className="flex-row items-center gap-2">
                <Ionicons name="alert-circle" size={18} color="#f59e0b" />
                <Text className="flex-1 text-sm text-amber-800 dark:text-amber-200">
                  Completa tu perfil para generar menus personalizados.
                </Text>
              </View>
            </Card>
          )}

          {/* Modo mock badge */}
          {modoMock && (
            <View className="flex-row items-center gap-2 rounded-2xl bg-purple-50 dark:bg-purple-950/30 px-3 py-2.5 border border-purple-200 dark:border-purple-900">
              <Ionicons name="flask" size={18} color="#a855f7" />
              <Text className="flex-1 text-sm text-purple-900 dark:text-purple-200">
                Modo MOCK — usas datos de prueba sin gastar tokens
              </Text>
            </View>
          )}

          {error && (
            <Card className="border-red-300 bg-red-50 dark:bg-red-950/30">
              <View className="flex-row items-center gap-2">
                <Ionicons name="alert-circle" size={18} color="#dc2626" />
                <Text className="flex-1 text-sm text-red-800 dark:text-red-200">{error}</Text>
              </View>
            </Card>
          )}

          <Button onPress={generar} loading={load} size="lg">
            {menu ? '↻ Regenerar menu semanal' : '✨ Generar mi primer menu'}
          </Button>

          {!menu && !load && (
            <EmptyState
              icon="🍳"
              title="Todavia no hay menu"
              message={grupoActivo
                ? `Genera el menu semanal para ${grupoActivo.nombre}. La IA va a armar 21 recetas adaptadas al grupo.`
                : 'Genera tu primer menu semanal. La IA va a armar 21 recetas adaptadas a tu perfil.'
              }
            />
          )}

          {menu && stats && (
            <Card elevated>
              <H2>Esta semana</H2>
              <View className="flex-row flex-wrap gap-5 mt-3">
                <Stat label="kcal/dia"     value={String(stats.caloriasPromedioDiario)} />
                <Stat label="veggie"       value={`${stats.platosVegetarianos} platos`} />
                <Stat label="cocina total" value={`${Math.round(stats.tiempoTotalMinutos / 60)}h`} />
              </View>
            </Card>
          )}

          {menu && (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
              >
                {menu.dias.map((d, i) => (
                  <Pressable
                    key={d.dia}
                    onPress={() => setDia(i)}
                    className={`rounded-full px-5 py-2.5 border ${
                      diaActivo === i
                        ? 'bg-brand-600 border-brand-600'
                        : 'bg-white dark:bg-[#15151b] border-neutral-300 dark:border-white/[0.08]'
                    }`}
                  >
                    <Text className={`text-sm font-bold ${
                      diaActivo === i ? 'text-white' : 'text-neutral-800 dark:text-neutral-200'
                    }`}>
                      {d.dia}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <DayView dia={menu.dias[diaActivo]} diaIndex={diaActivo} />
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      <LoadingOverlay visible={load} mensaje={modoMock ? 'Cargando menu mock…' : 'Generando con Claude…'} />

      {/* Modal selector de grupo */}
      <Modal
        visible={showGrupoPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGrupoPicker(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-end"
          onPress={() => setShowGrupoPicker(false)}
        >
          <View className="bg-white dark:bg-[#15151b] rounded-t-3xl px-4 pt-6 pb-10">
            <Text className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4">
              Cambiar grupo
            </Text>
            {grupos.map(g => {
              const activo = g.id === grupoActivo?.id
              const miembros = (g.miembros ?? []).filter(m => m.activo)
              return (
                <Pressable
                  key={g.id}
                  onPress={() => { setGrupoActivo(g); setShowGrupoPicker(false) }}
                  className={`flex-row items-center gap-3 rounded-2xl px-4 py-3.5 mb-2 border ${
                    activo
                      ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-500'
                      : 'bg-neutral-50 dark:bg-white/[0.04] border-transparent'
                  }`}
                >
                  <View className="flex-1">
                    <Text className={`font-bold ${
                      activo ? 'text-brand-700 dark:text-brand-300' : 'text-neutral-900 dark:text-neutral-100'
                    }`}>
                      {g.nombre}
                    </Text>
                    <Text className="text-xs text-neutral-500 mt-0.5">
                      {miembros.length} miembro{miembros.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  {activo && <Ionicons name="checkmark-circle" size={22} color="#ea580c" />}
                </Pressable>
              )
            })}
          </View>
        </Pressable>
      </Modal>
    </Screen>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-bold tracking-wider">
        {label}
      </Text>
      <Text className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">
        {value}
      </Text>
    </View>
  )
}

function IconBtn({ icon, onPress }: { icon: any; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="h-11 w-11 rounded-full bg-white dark:bg-[#15151b] border border-neutral-200 dark:border-white/[0.08] items-center justify-center"
    >
      <Ionicons name={icon} size={20} color="#a3a3a3" />
    </Pressable>
  )
}
