import { Ionicons } from '@expo/vector-icons'
import { Link, router } from 'expo-router'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Button, H1, Input, Screen, Subtle } from '@/components/ui'
import { login } from '@/lib/auth'
import { useAppStore } from '@/store/useAppStore'

export default function LoginScreen() {
  const setUsuario   = useAppStore(s => s.setUsuario)
  const cargarPerfil = useAppStore(s => s.cargarPerfil)
  const cargarGrupos = useAppStore(s => s.cargarGrupos)
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function entrar() {
    setLoading(true); setError(null)
    try {
      const u = await login(email, password)
      setUsuario(u)
      await Promise.all([cargarPerfil(), cargarGrupos()])
      router.replace('/')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al iniciar sesion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <SafeAreaView className="flex-1">
          <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}>
            <View className="items-center mb-8">
              <View className="h-20 w-20 rounded-3xl bg-brand-600 items-center justify-center mb-4">
                <Text className="text-4xl">🍳</Text>
              </View>
              <H1>Bienvenido de vuelta</H1>
              <Subtle className="mt-1">Inicia sesion para seguir cocinando</Subtle>
            </View>

            <View className="gap-4">
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="tu@email.com"
              />
              <Input
                label="Contrasena"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="••••••••"
              />

              {error && (
                <View className="flex-row items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 px-3 py-2.5">
                  <Ionicons name="alert-circle" size={18} color="#dc2626" />
                  <Text className="flex-1 text-sm text-red-700 dark:text-red-300">{error}</Text>
                </View>
              )}

              <Button onPress={entrar} loading={loading} size="lg" fullWidth>
                Entrar
              </Button>

              <View className="flex-row items-center justify-center gap-1 mt-2">
                <Subtle>¿Sos nuevo?</Subtle>
                <Link href="/auth/registro" className="text-brand-600 font-semibold text-sm">
                  Crear cuenta
                </Link>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Screen>
  )
}
