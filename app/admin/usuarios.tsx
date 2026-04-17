import { Ionicons } from '@expo/vector-icons'
import { useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, Text, View } from 'react-native'

import { Badge, Card, EmptyState, Screen, Subtle } from '@/components/ui'
import {
  cambiarRol, eliminarUsuario, listarUsuarios, type Rol, type Usuario,
} from '@/lib/auth'
import { useAppStore } from '@/store/useAppStore'

export default function AdminUsuarios() {
  const yo = useAppStore(s => s.usuario)
  const [users, setUsers] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)

  async function recargar() {
    setLoading(true)
    const u = await listarUsuarios()
    setUsers(u)
    setLoading(false)
  }

  useEffect(() => { recargar() }, [])

  function confirmarEliminar(u: Usuario) {
    if (u.id === yo?.id) {
      Alert.alert('No permitido', 'No podes eliminar tu propia cuenta desde aca.')
      return
    }
    Alert.alert(
      'Eliminar usuario',
      `¿Eliminar a ${u.nombre} (${u.email})? Esta accion no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await eliminarUsuario(u.id)
            recargar()
          },
        },
      ],
    )
  }

  async function alternarRol(u: Usuario) {
    if (u.id === yo?.id) {
      Alert.alert('No permitido', 'No podes cambiar tu propio rol.')
      return
    }
    const nuevo: Rol = u.rol === 'admin' ? 'user' : 'admin'
    await cambiarRol(u.id, nuevo)
    recargar()
  }

  if (!loading && users.length === 0) {
    return (
      <Screen>
        <EmptyState
          icon="👥"
          title="Sin usuarios"
          message="Todavia no hay cuentas registradas en este dispositivo."
        />
      </Screen>
    )
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
        <Subtle>{users.length} usuario{users.length === 1 ? '' : 's'} en el dispositivo</Subtle>

        {users.map(u => (
          <Card key={u.id} elevated>
            <View className="flex-row items-start gap-3">
              <View className={`h-12 w-12 rounded-full items-center justify-center ${
                u.rol === 'admin' ? 'bg-brand-100 dark:bg-brand-900/40' : 'bg-neutral-100 dark:bg-neutral-800'
              }`}>
                <Text className="text-xl">{u.rol === 'admin' ? '👑' : '👤'}</Text>
              </View>

              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                    {u.nombre}
                  </Text>
                  {u.id === yo?.id && <Badge variant="brand">Vos</Badge>}
                </View>
                <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                  {u.email}
                </Text>
                <Text className="text-xs text-neutral-400 mt-1">
                  Ultimo acceso: {new Date(u.ultimoAcceso).toLocaleString('es-UY')}
                </Text>
                <View className="mt-2">
                  <Badge variant={u.rol === 'admin' ? 'brand' : 'neutral'}>
                    {u.rol === 'admin' ? 'ADMIN' : 'USER'}
                  </Badge>
                </View>
              </View>
            </View>

            <View className="flex-row gap-2 mt-3">
              <Pressable
                onPress={() => alternarRol(u)}
                className="flex-1 flex-row items-center justify-center gap-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 py-2.5 active:opacity-70"
              >
                <Ionicons
                  name={u.rol === 'admin' ? 'arrow-down' : 'arrow-up'}
                  size={16}
                  color="#525252"
                />
                <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  {u.rol === 'admin' ? 'Bajar a user' : 'Promover a admin'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => confirmarEliminar(u)}
                className="flex-row items-center justify-center gap-1 rounded-xl bg-red-50 dark:bg-red-950/40 px-3 py-2.5 active:opacity-70"
              >
                <Ionicons name="trash" size={16} color="#dc2626" />
              </Pressable>
            </View>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  )
}
