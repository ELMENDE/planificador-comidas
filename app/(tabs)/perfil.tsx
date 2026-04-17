import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useState } from 'react'
import { Alert, Pressable, ScrollView, Share, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Badge, Button, Card, Chip, H1, H2, Input, Screen, Subtle } from '@/components/ui'
import { actualizarUsuario, borrarCuenta, cambiarPassword, logout } from '@/lib/auth'
import { limpiarSentryUsuario } from '@/lib/sentry'
import {
  borrarGrupo,
  crearGrupo,
  crearInvitacion,
  expulsarMiembro,
  salirDeGrupo,
  toggleMiembroActivo,
  transferirOwner,
} from '@/lib/grupos'
import { calcularBMR, calcularTDEE, ETIQUETAS_ACTIVIDAD, factorActividad } from '@/lib/nutrition'
import { useAppStore } from '@/store/useAppStore'
import type { NivelActividad, Objetivo, Sexo } from '@/types/menu'

const NIVELES_ACTIVIDAD: NivelActividad[] = [
  'sedentario', 'ligero', 'moderado', 'intenso', 'muy_intenso',
]
const RESTRICCIONES = [
  'vegetariano', 'vegano', 'celiaco', 'sin_lactosa',
  'sin_frutos_secos', 'diabetico',
]
const COCINAS = [
  'criolla', 'italiana', 'mexicana', 'asiatica',
  'mediterranea', 'arabe',
]

function toInt(s: string, fb: number): number {
  if (s.trim() === '') return fb
  const n = parseInt(s, 10)
  return Number.isFinite(n) ? n : fb
}

export default function PerfilScreen() {
  const usuario       = useAppStore(s => s.usuario)
  const setUsuario    = useAppStore(s => s.setUsuario)
  const perfil        = useAppStore(s => s.perfil)
  const guardarPerfil = useAppStore(s => s.guardarPerfil)
  const grupos        = useAppStore(s => s.grupos)
  const grupoActivo   = useAppStore(s => s.grupoActivo)
  const setGrupoActivo = useAppStore(s => s.setGrupoActivo)
  const cargarGrupos  = useAppStore(s => s.cargarGrupos)

  // --- Bio local state ---
  const [sexo,      setSexo]      = useState<Sexo>(perfil?.sexo ?? 'masculino')
  const [edadStr,   setEdadStr]   = useState(String(perfil?.edad ?? 30))
  const [pesoStr,   setPesoStr]   = useState(String(perfil?.peso_kg ?? 75))
  const [altStr,    setAltStr]    = useState(String(perfil?.altura_cm ?? 175))
  const [actividad, setActividad] = useState<NivelActividad>(perfil?.actividad ?? 'moderado')
  const [objetivo,  setObjetivo]  = useState<Objetivo>(perfil?.objetivo ?? 'mantener')
  const [restricciones, setRestricciones] = useState<string[]>(perfil?.restricciones ?? [])
  const [guardado,  setGuardado]  = useState(false)
  const [saving,    setSaving]    = useState(false)

  // --- Cuenta ---
  const [editandoCuenta, setEditandoCuenta] = useState(false)
  const [nombreCuenta, setNombreCuenta] = useState(usuario?.nombre ?? '')
  const [emailCuenta,  setEmailCuenta]  = useState(usuario?.email ?? '')
  const [errorCuenta,  setErrorCuenta]  = useState<string | null>(null)
  const [savingCuenta, setSavingCuenta] = useState(false)
  const [cambiandoPwd, setCambiandoPwd] = useState(false)
  const [pwdActual, setPwdActual] = useState('')
  const [pwdNueva,  setPwdNueva]  = useState('')
  const [pwdNueva2, setPwdNueva2] = useState('')
  const [errorPwd,  setErrorPwd]  = useState<string | null>(null)
  const [savingPwd, setSavingPwd] = useState(false)

  // --- Crear grupo ---
  const [creandoGrupo,   setCreandoGrupo]   = useState(false)
  const [nombreGrupo,    setNombreGrupo]    = useState('')
  const [cocinasGrupo,   setCocinasGrupo]   = useState<string[]>([])
  const [restGrupo,      setRestGrupo]      = useState<string[]>([])
  const [tiempoGrupo,    setTiempoGrupo]    = useState('45')
  const [savingGrupo,    setSavingGrupo]    = useState(false)

  // --- Unirse con codigo ---
  const [uniendose,     setUniendose]     = useState(false)
  const [codigoInvite,  setCodigoInvite]  = useState('')

  const bio = {
    sexo,
    edad:      toInt(edadStr, 30),
    peso_kg:   toInt(pesoStr, 75),
    altura_cm: toInt(altStr, 175),
    actividad,
    objetivo,
  }
  const bmrPreview  = Math.round(calcularBMR(sexo, bio.peso_kg, bio.altura_cm, bio.edad))
  const tdeePreview = calcularTDEE(bio)

  async function guardarBio() {
    setSaving(true)
    try {
      await guardarPerfil({
        sexo,
        edad:          bio.edad,
        peso_kg:       bio.peso_kg,
        altura_cm:     bio.altura_cm,
        actividad,
        objetivo,
        restricciones,
        tdee_cache:    tdeePreview,
      })
      setGuardado(true)
      setTimeout(() => setGuardado(false), 1500)
    } catch {}
    setSaving(false)
  }

  async function guardarCuenta() {
    if (!usuario) return
    setErrorCuenta(null); setSavingCuenta(true)
    try {
      const u = await actualizarUsuario(usuario.id, { nombre: nombreCuenta, email: emailCuenta })
      setUsuario(u)
      setEditandoCuenta(false)
    } catch (e) {
      setErrorCuenta(e instanceof Error ? e.message : 'Error')
    } finally { setSavingCuenta(false) }
  }

  async function guardarPwd() {
    if (!usuario) return
    setErrorPwd(null)
    if (pwdNueva !== pwdNueva2) { setErrorPwd('Las contrasenas no coinciden'); return }
    setSavingPwd(true)
    try {
      await cambiarPassword(usuario.id, pwdActual, pwdNueva)
      setPwdActual(''); setPwdNueva(''); setPwdNueva2('')
      setCambiandoPwd(false)
      Alert.alert('Listo', 'Contrasena actualizada')
    } catch (e) {
      setErrorPwd(e instanceof Error ? e.message : 'Error')
    } finally { setSavingPwd(false) }
  }

  function confirmarLogout() {
    Alert.alert('Cerrar sesion', '¿Querés cerrar sesion?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir', style: 'destructive',
        onPress: async () => {
          await logout()
          limpiarSentryUsuario()
          setUsuario(null)
          router.replace('/auth/login')
        },
      },
    ])
  }

  async function handleCrearGrupo() {
    if (!nombreGrupo.trim()) return
    setSavingGrupo(true)
    try {
      const g = await crearGrupo({
        nombre: nombreGrupo.trim(),
        restricciones_grupo: restGrupo,
        cocinas_preferidas:  cocinasGrupo,
        tiempo_max_coccion:  toInt(tiempoGrupo, 45),
      })
      await cargarGrupos()
      setGrupoActivo(g)
      setCreandoGrupo(false)
      setNombreGrupo('')
    } catch {}
    setSavingGrupo(false)
  }

  async function handleInvitar(grupoId: string) {
    try {
      const inv = await crearInvitacion(grupoId)
      const link = `planificador://invitar/${inv.token}`
      await Share.share({
        message: `Unite a mi grupo familiar en Planificador de Comidas: ${link}`,
      })
    } catch {}
  }

  async function handleUnirseConCodigo() {
    if (!codigoInvite.trim()) return
    try {
      // Extraer token del link o usar directo
      let token = codigoInvite.trim()
      if (token.includes('/invitar/')) {
        token = token.split('/invitar/').pop() ?? token
      }
      const { aceptarInvitacion } = await import('@/lib/grupos')
      const g = await aceptarInvitacion(token)
      await cargarGrupos()
      setGrupoActivo(g)
      setUniendose(false)
      setCodigoInvite('')
      Alert.alert('Listo', `Te uniste a ${g.nombre}`)
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo unir')
    }
  }

  const esOwnerActivo = grupoActivo?.owner_id === usuario?.id

  return (
    <Screen>
      <SafeAreaView edges={['top']} className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
          <H1>Perfil</H1>

          {/* ---- Card usuario ---- */}
          <Card elevated>
            <View className="flex-row items-center gap-3">
              <View className="h-14 w-14 rounded-full bg-brand-100 dark:bg-brand-900/40 items-center justify-center">
                <Text className="text-2xl">{perfil?.emoji ?? '👤'}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  {usuario?.nombre}
                </Text>
                <Text className="text-sm text-neutral-500">{usuario?.email}</Text>
              </View>
              <Pressable onPress={confirmarLogout} hitSlop={10}
                className="h-9 w-9 rounded-full bg-red-50 dark:bg-red-950/40 items-center justify-center">
                <Ionicons name="log-out-outline" size={18} color="#dc2626" />
              </Pressable>
            </View>

            {!editandoCuenta && !cambiandoPwd && (
              <View className="flex-row gap-2 mt-4">
                <View className="flex-1">
                  <Button variant="secondary" size="sm" onPress={() => setEditandoCuenta(true)}>Editar</Button>
                </View>
                <View className="flex-1">
                  <Button variant="secondary" size="sm" onPress={() => setCambiandoPwd(true)}>Contrasena</Button>
                </View>
              </View>
            )}

            {editandoCuenta && (
              <View className="mt-4 gap-3 border-t border-neutral-200 dark:border-white/[0.06] pt-4">
                <Input label="Nombre" value={nombreCuenta} onChangeText={setNombreCuenta} />
                <Input label="Email" value={emailCuenta} onChangeText={setEmailCuenta} autoCapitalize="none" keyboardType="email-address" />
                {errorCuenta && <Text className="text-xs text-red-600">{errorCuenta}</Text>}
                <View className="flex-row gap-2">
                  <View className="flex-1"><Button variant="secondary" onPress={() => setEditandoCuenta(false)}>Cancelar</Button></View>
                  <View className="flex-1"><Button onPress={guardarCuenta} loading={savingCuenta}>Guardar</Button></View>
                </View>
              </View>
            )}

            {cambiandoPwd && (
              <View className="mt-4 gap-3 border-t border-neutral-200 dark:border-white/[0.06] pt-4">
                <Input label="Contrasena actual" value={pwdActual} onChangeText={setPwdActual} secureTextEntry />
                <Input label="Nueva contrasena" value={pwdNueva} onChangeText={setPwdNueva} secureTextEntry />
                <Input label="Repetir nueva" value={pwdNueva2} onChangeText={setPwdNueva2} secureTextEntry />
                {errorPwd && <Text className="text-xs text-red-600">{errorPwd}</Text>}
                <View className="flex-row gap-2">
                  <View className="flex-1"><Button variant="secondary" onPress={() => setCambiandoPwd(false)}>Cancelar</Button></View>
                  <View className="flex-1"><Button onPress={guardarPwd} loading={savingPwd}>Cambiar</Button></View>
                </View>
              </View>
            )}
          </Card>

          {/* ---- Grupo familiar ---- */}
          <H2>Grupo familiar</H2>

          {grupos.length === 0 && !creandoGrupo && !uniendose && (
            <Card className="gap-3">
              <Text className="text-sm text-neutral-600 dark:text-neutral-400">
                No estás en ningun grupo. Creá uno para planificar comidas con tu familia,
                o unite con un codigo de invitacion.
              </Text>
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Button onPress={() => setCreandoGrupo(true)}>Crear grupo</Button>
                </View>
                <View className="flex-1">
                  <Button variant="secondary" onPress={() => setUniendose(true)}>Tengo un codigo</Button>
                </View>
              </View>
            </Card>
          )}

          {uniendose && (
            <Card className="gap-3">
              <H2>Unirse con codigo</H2>
              <Subtle>Pegá el link o codigo que te mandaron</Subtle>
              <Input value={codigoInvite} onChangeText={setCodigoInvite} placeholder="planificador://invitar/abc123..." autoCapitalize="none" />
              <View className="flex-row gap-2">
                <View className="flex-1"><Button variant="secondary" onPress={() => setUniendose(false)}>Cancelar</Button></View>
                <View className="flex-1"><Button onPress={handleUnirseConCodigo}>Unirme</Button></View>
              </View>
            </Card>
          )}

          {creandoGrupo && (
            <Card className="gap-3">
              <H2>Crear grupo familiar</H2>
              <Input label="Nombre del grupo" value={nombreGrupo} onChangeText={setNombreGrupo} placeholder="Ej: Familia Mendez" />
              <Input label="Tiempo max por comida (min)" value={tiempoGrupo} onChangeText={setTiempoGrupo} keyboardType="number-pad" />
              <View>
                <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Restricciones del grupo (aplican a TODOS al cocinar)
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {RESTRICCIONES.map(r => (
                    <Chip key={r} label={r.replace('_', ' ')} selected={restGrupo.includes(r)}
                      onPress={() => setRestGrupo(s => s.includes(r) ? s.filter(x => x !== r) : [...s, r])} />
                  ))}
                </View>
              </View>
              <View>
                <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Cocinas preferidas</Text>
                <View className="flex-row flex-wrap gap-2">
                  {COCINAS.map(c => (
                    <Chip key={c} label={c} selected={cocinasGrupo.includes(c)}
                      onPress={() => setCocinasGrupo(s => s.includes(c) ? s.filter(x => x !== c) : [...s, c])} />
                  ))}
                </View>
              </View>
              <View className="flex-row gap-2">
                <View className="flex-1"><Button variant="secondary" onPress={() => setCreandoGrupo(false)}>Cancelar</Button></View>
                <View className="flex-1"><Button onPress={handleCrearGrupo} loading={savingGrupo}>Crear</Button></View>
              </View>
            </Card>
          )}

          {/* Grupos existentes */}
          {grupos.map(g => {
            const esOwner = g.owner_id === usuario?.id
            const miembros = g.miembros ?? []
            const totalTdee = miembros.filter(m => m.activo).reduce((s, m) => s + (m.perfil?.tdee_cache ?? 2000), 0)
            const isActivo = grupoActivo?.id === g.id

            return (
              <Card key={g.id} elevated={isActivo} className={`gap-3 ${isActivo ? 'border-brand-500' : ''}`}>
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{g.nombre}</Text>
                      {esOwner && <Badge variant="brand">Owner</Badge>}
                    </View>
                    <Text className="text-xs text-neutral-500 mt-1">
                      {miembros.length} miembro{miembros.length !== 1 ? 's' : ''} · {totalTdee} kcal/dia grupo
                    </Text>
                  </View>
                  {!isActivo && (
                    <Button size="sm" onPress={() => setGrupoActivo(g)}>Activar</Button>
                  )}
                </View>

                {/* Lista de miembros */}
                <View className="gap-2">
                  {miembros.map(m => (
                    <View key={m.user_id} className="flex-row items-center gap-2 rounded-xl bg-neutral-50 dark:bg-white/[0.04] px-3 py-2.5">
                      <Text className="text-lg">{m.perfil?.emoji ?? '👤'}</Text>
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                          {m.apodo ?? m.perfil?.nombre ?? 'Sin nombre'}
                          {m.user_id === usuario?.id ? ' (vos)' : ''}
                        </Text>
                        <Text className="text-xs text-neutral-500">
                          {m.perfil?.tdee_cache ?? '?'} kcal/dia · {m.activo ? 'Activo' : 'Inactivo'}
                        </Text>
                      </View>
                      {esOwner && m.user_id !== usuario?.id && (
                        <View className="flex-row gap-1">
                          <Pressable
                            onPress={() => toggleMiembroActivo(g.id, m.user_id, !m.activo).then(cargarGrupos)}
                            className="h-8 w-8 rounded-full bg-neutral-100 dark:bg-white/[0.08] items-center justify-center"
                          >
                            <Ionicons name={m.activo ? 'eye' : 'eye-off'} size={16} color="#737373" />
                          </Pressable>
                          <Pressable
                            onPress={() => Alert.alert('Expulsar', `¿Expulsar a ${m.perfil?.nombre}?`, [
                              { text: 'Cancelar', style: 'cancel' },
                              { text: 'Expulsar', style: 'destructive', onPress: () => expulsarMiembro(g.id, m.user_id).then(cargarGrupos) },
                            ])}
                            className="h-8 w-8 rounded-full bg-red-50 dark:bg-red-950/30 items-center justify-center"
                          >
                            <Ionicons name="close" size={16} color="#dc2626" />
                          </Pressable>
                        </View>
                      )}
                    </View>
                  ))}
                </View>

                {/* Acciones del grupo */}
                <View className="flex-row gap-2">
                  {esOwner && (
                    <View className="flex-1">
                      <Button size="sm" onPress={() => handleInvitar(g.id)}>Invitar</Button>
                    </View>
                  )}
                  {!esOwner && (
                    <View className="flex-1">
                      <Button size="sm" variant="danger"
                        onPress={() => Alert.alert('Salir', `¿Salir de ${g.nombre}?`, [
                          { text: 'Cancelar', style: 'cancel' },
                          { text: 'Salir', style: 'destructive', onPress: () => salirDeGrupo(g.id).then(cargarGrupos) },
                        ])}>
                        Salir del grupo
                      </Button>
                    </View>
                  )}
                </View>
              </Card>
            )
          })}

          {grupos.length > 0 && !creandoGrupo && (
            <Button variant="secondary" onPress={() => setCreandoGrupo(true)}>+ Crear otro grupo</Button>
          )}

          {/* ---- Nutricion ---- */}
          <H2>Nutricion</H2>
          <Card elevated className="gap-4">
            <View className="rounded-2xl bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-900/40 p-4">
              <Text className="text-[10px] uppercase tracking-widest text-brand-700 dark:text-brand-300 font-bold">
                Tu objetivo calorico
              </Text>
              <Text className="text-4xl font-extrabold text-brand-700 dark:text-brand-200 mt-1">
                {tdeePreview}<Text className="text-lg font-bold"> kcal/dia</Text>
              </Text>
              <View className="flex-row gap-4 mt-3">
                <View>
                  <Text className="text-[10px] uppercase text-neutral-500 font-bold">BMR</Text>
                  <Text className="text-base font-bold text-neutral-800 dark:text-neutral-200">{bmrPreview}</Text>
                </View>
                <View>
                  <Text className="text-[10px] uppercase text-neutral-500 font-bold">Factor</Text>
                  <Text className="text-base font-bold text-neutral-800 dark:text-neutral-200">x{factorActividad(actividad)}</Text>
                </View>
                <View>
                  <Text className="text-[10px] uppercase text-neutral-500 font-bold">Ajuste</Text>
                  <Text className="text-base font-bold text-neutral-800 dark:text-neutral-200">
                    {objetivo === 'perder' ? '-400' : objetivo === 'ganar' ? '+300' : '0'}
                  </Text>
                </View>
              </View>
            </View>

            <View>
              <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Sexo</Text>
              <View className="flex-row gap-2">
                <Chip label="Masculino" selected={sexo === 'masculino'} onPress={() => setSexo('masculino')} />
                <Chip label="Femenino"  selected={sexo === 'femenino'}  onPress={() => setSexo('femenino')} />
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1"><Input label="Edad" value={edadStr} onChangeText={setEdadStr} keyboardType="number-pad" /></View>
              <View className="flex-1"><Input label="Peso (kg)" value={pesoStr} onChangeText={setPesoStr} keyboardType="number-pad" /></View>
              <View className="flex-1"><Input label="Altura (cm)" value={altStr} onChangeText={setAltStr} keyboardType="number-pad" /></View>
            </View>

            <View>
              <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Actividad</Text>
              <View className="gap-2">
                {NIVELES_ACTIVIDAD.map(a => (
                  <Pressable key={a} onPress={() => setActividad(a)}
                    className={`rounded-2xl px-4 py-3 border ${actividad === a ? 'bg-brand-600 border-brand-600' : 'bg-white dark:bg-[#15151b] border-neutral-300 dark:border-white/[0.08]'}`}>
                    <Text className={`text-sm font-semibold ${actividad === a ? 'text-white' : 'text-neutral-800 dark:text-neutral-200'}`}>
                      {ETIQUETAS_ACTIVIDAD[a]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View>
              <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Objetivo</Text>
              <View className="flex-row gap-2">
                <Chip label="Perder peso" selected={objetivo === 'perder'} onPress={() => setObjetivo('perder')} />
                <Chip label="Mantener" selected={objetivo === 'mantener'} onPress={() => setObjetivo('mantener')} />
                <Chip label="Ganar masa" selected={objetivo === 'ganar'} onPress={() => setObjetivo('ganar')} />
              </View>
            </View>

            <View>
              <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Mis restricciones</Text>
              <View className="flex-row flex-wrap gap-2">
                {RESTRICCIONES.map(r => (
                  <Chip key={r} label={r.replace('_', ' ')} selected={restricciones.includes(r)}
                    onPress={() => setRestricciones(s => s.includes(r) ? s.filter(x => x !== r) : [...s, r])} />
                ))}
              </View>
            </View>
          </Card>

          {guardado && (
            <View className="flex-row items-center gap-2 self-center rounded-full bg-green-100 dark:bg-green-900/40 px-4 py-2">
              <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
              <Text className="text-sm font-semibold text-green-700 dark:text-green-300">Guardado</Text>
            </View>
          )}

          <Button onPress={guardarBio} loading={saving} size="lg">Guardar perfil</Button>

          {/* Zona peligrosa */}
          <View className="mt-8 pt-6 border-t border-neutral-200 dark:border-white/[0.06]">
            <Button
              variant="danger"
              size="sm"
              onPress={() => Alert.alert(
                'Borrar cuenta',
                'Esta accion es IRREVERSIBLE. Se borra tu perfil, datos, y salis de todos los grupos. ¿Seguro?',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Borrar mi cuenta',
                    style: 'destructive',
                    onPress: () => {
                      borrarCuenta()
                        .then(() => {
                          setUsuario(null)
                          router.replace('/auth/login')
                        })
                        .catch(e => Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo borrar'))
                    },
                  },
                ],
              )}
            >
              Borrar mi cuenta
            </Button>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Screen>
  )
}
