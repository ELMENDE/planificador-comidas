import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useMemo, useState } from 'react'
import { Modal, Pressable, ScrollView, Share, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Badge, Button, Card, EmptyState, H1, H2, Input, Screen, Subtle } from '@/components/ui'
import { capitalizar, EMOJI_CATEGORIA, generarListaCompras, keyItem, listaATexto } from '@/lib/shopping-list'
import { useAppStore } from '@/store/useAppStore'
import type { Categoria, ItemLista, Unidad } from '@/types/menu'

const UNIDADES: Unidad[] = ['g', 'kg', 'ml', 'l', 'unid', 'taza', 'cdita', 'cda']
const CATEGORIAS: Categoria[] = [
  'verduras', 'frutas', 'proteinas', 'lacteos',
  'panaderia', 'almacen', 'condimentos',
]

export default function ComprasScreen() {
  const menu               = useAppStore(s => s.menuActual)
  const despensa           = useAppStore(s => s.despensa)
  const tildados           = useAppStore(s => s.tildados)
  const toggleTildado      = useAppStore(s => s.toggleTildado)
  const limpiarTildados    = useAppStore(s => s.limpiarTildados)
  const overrides          = useAppStore(s => s.overridesCantidad)
  const setOverride        = useAppStore(s => s.setOverrideCantidad)
  const itemsExtras        = useAppStore(s => s.itemsExtras)
  const agregarExtra       = useAppStore(s => s.agregarItemExtra)
  const quitarExtra        = useAppStore(s => s.quitarItemExtra)

  const [verDespensa, setVerDespensa] = useState(true)

  // --- Modal de editar cantidad ---
  const [editKey, setEditKey] = useState<string | null>(null)
  const [editVal, setEditVal] = useState('')

  function abrirEditar(k: string, valActual: number) {
    setEditKey(k)
    setEditVal(String(valActual))
  }
  function guardarEditar() {
    if (!editKey) return
    const n = Number(editVal)
    if (Number.isFinite(n) && n > 0) {
      setOverride(editKey, n)
    }
    setEditKey(null)
  }
  function resetearEditar() {
    if (!editKey) return
    setOverride(editKey, null)
    setEditKey(null)
  }

  // --- Modal de agregar item extra ---
  const [verAgregar, setVerAgregar]    = useState(false)
  const [exNombre,  setExNombre]       = useState('')
  const [exCant,    setExCant]         = useState('1')
  const [exUnidad,  setExUnidad]       = useState<Unidad>('unid')
  const [exCat,     setExCat]          = useState<Categoria>('almacen')

  function guardarExtra() {
    const n = exNombre.trim()
    const c = Number(exCant)
    if (!n || !Number.isFinite(c) || c <= 0) return
    agregarExtra({ nombre: n, cantidad: c, unidad: exUnidad, categoria: exCat })
    setExNombre(''); setExCant('1'); setExUnidad('unid'); setExCat('almacen')
    setVerAgregar(false)
  }

  // --- Lista calculada del menu ---
  const items: ItemLista[] = useMemo(
    () => menu ? generarListaCompras(menu, despensa) : [],
    [menu, despensa],
  )

  const visibles = useMemo(
    () => verDespensa ? items : items.filter(i => !i.en_despensa),
    [items, verDespensa],
  )

  const grupos = useMemo(() => {
    const m = new Map<Categoria, ItemLista[]>()
    for (const it of visibles) {
      const arr = m.get(it.categoria) ?? []
      arr.push(it)
      m.set(it.categoria, arr)
    }
    return m
  }, [visibles])

  // El total y progreso incluyen items del menu + extras
  const totalExtras = itemsExtras.length
  const total       = visibles.length + totalExtras
  const tildCount   =
    visibles.filter(i => tildados.includes(keyItem(i))).length +
    itemsExtras.filter(e => tildados.includes(`extra__${e.id}`)).length
  const progreso    = total ? (tildCount / total) * 100 : 0

  function cantidadFinal(it: ItemLista): number {
    const k = keyItem(it)
    return overrides[k] ?? it.cantidad
  }

  async function compartir() {
    const conOverrides = items.map(it => ({ ...it, cantidad: cantidadFinal(it) }))
    let texto = listaATexto(conOverrides)
    if (itemsExtras.length) {
      texto += '\n\n📌 EXTRAS\n'
      for (const e of itemsExtras) {
        texto += `  • ${capitalizar(e.nombre)} — ${e.cantidad} ${e.unidad}\n`
      }
    }
    try {
      await Share.share({ message: texto.trim() })
    } catch { /* ignore */ }
  }

  // Caso especial: no hay menu pero pueden existir extras
  if (!menu && itemsExtras.length === 0) {
    return (
      <Screen>
        <SafeAreaView edges={['top']} className="flex-1">
          <View className="p-4">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1">
                <Subtle>🛒 Tu super</Subtle>
                <H1>Lista</H1>
              </View>
            </View>
            <EmptyState
              icon="🛒"
              title="No hay lista"
              message="Generá un menu o agregá items extras para empezar."
              action={
                <Button onPress={() => setVerAgregar(true)}>➕ Agregar item</Button>
              }
            />
          </View>
          {renderModalAgregar()}
        </SafeAreaView>
      </Screen>
    )
  }

  function renderModalAgregar() {
    return (
      <Modal
        visible={verAgregar}
        transparent
        animationType="slide"
        onRequestClose={() => setVerAgregar(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setVerAgregar(false)}
        >
          <Pressable onPress={e => e.stopPropagation()}>
            <View className="bg-white dark:bg-neutral-900 rounded-t-3xl p-5 gap-3">
              <View className="self-center w-12 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full mb-2" />
              <H2>➕ Agregar item extra</H2>
              <Subtle>Estos items persisten entre regeneraciones de menu.</Subtle>

              <Input
                label="Nombre"
                value={exNombre}
                onChangeText={setExNombre}
                placeholder="ej: papel higienico"
                autoFocus
              />
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Input
                    label="Cantidad"
                    value={exCant}
                    onChangeText={setExCant}
                    keyboardType="numeric"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Unidad
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-1">
                      {UNIDADES.map(u => (
                        <Pressable
                          key={u}
                          onPress={() => setExUnidad(u)}
                          className={`rounded-lg px-3 py-2.5 border ${
                            exUnidad === u
                              ? 'bg-brand-600 border-brand-600'
                              : 'bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700'
                          }`}
                        >
                          <Text className={`text-xs ${
                            exUnidad === u ? 'text-white' : 'text-neutral-700 dark:text-neutral-300'
                          }`}>{u}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>

              <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                Categoria
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-1.5">
                  {CATEGORIAS.map(c => (
                    <Pressable
                      key={c}
                      onPress={() => setExCat(c)}
                      className={`rounded-full px-3 py-2 border ${
                        exCat === c
                          ? 'bg-brand-600 border-brand-600'
                          : 'bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700'
                      }`}
                    >
                      <Text className={`text-xs ${
                        exCat === c ? 'text-white' : 'text-neutral-700 dark:text-neutral-300'
                      }`}>{EMOJI_CATEGORIA[c]} {c}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              <View className="flex-row gap-2 mt-2">
                <View className="flex-1">
                  <Button variant="secondary" onPress={() => setVerAgregar(false)}>
                    Cancelar
                  </Button>
                </View>
                <View className="flex-1">
                  <Button onPress={guardarExtra}>Agregar</Button>
                </View>
              </View>
              <View className="h-4" />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    )
  }

  function renderModalEditar() {
    return (
      <Modal
        visible={editKey !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditKey(null)}
      >
        <Pressable
          className="flex-1 bg-black/50 items-center justify-center p-6"
          onPress={() => setEditKey(null)}
        >
          <Pressable
            onPress={e => e.stopPropagation()}
            className="bg-white dark:bg-neutral-900 rounded-3xl p-5 w-full max-w-sm gap-3"
          >
            <H2>✏️ Editar cantidad</H2>
            <Subtle>Cambia solo en tu lista, no en las recetas.</Subtle>
            <Input
              value={editVal}
              onChangeText={setEditVal}
              keyboardType="numeric"
              autoFocus
            />
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Button variant="secondary" onPress={resetearEditar}>↺ Original</Button>
              </View>
              <View className="flex-1">
                <Button onPress={guardarEditar}>Guardar</Button>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    )
  }

  return (
    <Screen>
      <SafeAreaView edges={['top']} className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Subtle>🛒 Tu super</Subtle>
              <H1>Lista</H1>
            </View>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setVerAgregar(true)}
                className="h-11 w-11 rounded-full bg-brand-600 items-center justify-center"
              >
                <Ionicons name="add" size={22} color="#fff" />
              </Pressable>
              <Pressable
                onPress={compartir}
                className="h-11 w-11 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 items-center justify-center"
              >
                <Ionicons name="share-outline" size={20} color="#525252" />
              </Pressable>
              <Pressable
                onPress={limpiarTildados}
                className="h-11 w-11 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 items-center justify-center"
              >
                <Ionicons name="refresh" size={20} color="#525252" />
              </Pressable>
            </View>
          </View>

          <Card elevated>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                Progreso
              </Text>
              <Badge variant={tildCount === total && total > 0 ? 'success' : 'brand'}>
                {tildCount} / {total}
              </Badge>
            </View>
            <View className="h-2.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
              <View
                className="h-full bg-brand-500"
                style={{ width: `${progreso}%` }}
              />
            </View>
            <Pressable
              onPress={() => setVerDespensa(v => !v)}
              className="mt-3 flex-row items-center gap-2"
            >
              <Ionicons
                name={verDespensa ? 'checkbox' : 'square-outline'}
                size={18}
                color="#ea580c"
              />
              <Text className="text-sm text-neutral-700 dark:text-neutral-300">
                Mostrar items que ya tengo en despensa
              </Text>
            </Pressable>
          </Card>

          {Array.from(grupos.entries()).map(([cat, lista]) => (
            <View key={cat}>
              <H2>{EMOJI_CATEGORIA[cat]} {capitalizar(cat)}</H2>
              <Card className="mt-2 p-0">
                {lista.map((it, idx) => {
                  const k        = keyItem(it)
                  const on       = tildados.includes(k)
                  const cantFinal= cantidadFinal(it)
                  const editado  = overrides[k] !== undefined
                  return (
                    <View
                      key={k}
                      className={`flex-row items-center gap-2 px-4 py-3 ${
                        idx !== lista.length - 1 ? 'border-b border-neutral-100 dark:border-neutral-800' : ''
                      }`}
                    >
                      <Pressable
                        onPress={() => {
                          Haptics.selectionAsync()
                          toggleTildado(k)
                        }}
                        hitSlop={6}
                      >
                        <Ionicons
                          name={on ? 'checkmark-circle' : 'ellipse-outline'}
                          size={22}
                          color={on ? '#ea580c' : '#9ca3af'}
                        />
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          Haptics.selectionAsync()
                          toggleTildado(k)
                        }}
                        onLongPress={() => abrirEditar(k, cantFinal)}
                        className="flex-1 flex-row items-center gap-2"
                      >
                        <Text className={`flex-1 ${on ? 'line-through text-neutral-400' : 'text-neutral-900 dark:text-neutral-100'}`}>
                          {capitalizar(it.nombre)}
                          {it.en_despensa && (
                            <Text className="text-xs text-brand-600">  (despensa)</Text>
                          )}
                        </Text>
                        <Text className={`text-sm ${editado ? 'text-brand-600 font-bold' : 'text-neutral-500 dark:text-neutral-400'}`}>
                          {cantFinal} {it.unidad}
                        </Text>
                      </Pressable>
                      <Pressable
                        hitSlop={8}
                        onPress={() => abrirEditar(k, cantFinal)}
                        className="h-8 w-8 items-center justify-center"
                      >
                        <Ionicons name="pencil" size={14} color="#9ca3af" />
                      </Pressable>
                    </View>
                  )
                })}
              </Card>
            </View>
          ))}

          {/* Items extras */}
          {itemsExtras.length > 0 && (
            <View>
              <H2>📌 Mis items extras</H2>
              <Card className="mt-2 p-0">
                {itemsExtras.map((e, idx) => {
                  const k = `extra__${e.id}`
                  const on = tildados.includes(k)
                  return (
                    <View
                      key={e.id}
                      className={`flex-row items-center gap-2 px-4 py-3 ${
                        idx !== itemsExtras.length - 1 ? 'border-b border-neutral-100 dark:border-neutral-800' : ''
                      }`}
                    >
                      <Pressable
                        onPress={() => {
                          Haptics.selectionAsync()
                          toggleTildado(k)
                        }}
                        hitSlop={6}
                      >
                        <Ionicons
                          name={on ? 'checkmark-circle' : 'ellipse-outline'}
                          size={22}
                          color={on ? '#ea580c' : '#9ca3af'}
                        />
                      </Pressable>
                      <View className="flex-1">
                        <Text className={`${on ? 'line-through text-neutral-400' : 'text-neutral-900 dark:text-neutral-100'}`}>
                          {capitalizar(e.nombre)}
                        </Text>
                        <Text className="text-xs text-neutral-500">
                          {EMOJI_CATEGORIA[e.categoria]} {capitalizar(e.categoria)}
                        </Text>
                      </View>
                      <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                        {e.cantidad} {e.unidad}
                      </Text>
                      <Pressable
                        hitSlop={8}
                        onPress={() => quitarExtra(e.id)}
                        className="h-8 w-8 items-center justify-center"
                      >
                        <Ionicons name="close" size={16} color="#ef4444" />
                      </Pressable>
                    </View>
                  )
                })}
              </Card>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {renderModalEditar()}
      {renderModalAgregar()}
    </Screen>
  )
}
