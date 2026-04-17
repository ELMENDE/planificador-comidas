import { Ionicons } from '@expo/vector-icons'
import { Link, router } from 'expo-router'
import { useRef, useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Button, H1, Input, Screen, Subtle } from '@/components/ui'
import { registrar, verificarOTP } from '@/lib/auth'
import { useAppStore } from '@/store/useAppStore'

// ─── Pantalla de ingreso de codigo OTP ───────────────────────────────────────

function PantallaOTP({
  email,
  onVerificado,
  onVolver,
}: {
  email: string
  onVerificado: () => void
  onVolver: () => void
}) {
  const setUsuario   = useAppStore(s => s.setUsuario)
  const cargarPerfil = useAppStore(s => s.cargarPerfil)

  const [codigo,  setCodigo]  = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const inputRef = useRef<TextInput>(null)

  async function verificar() {
    if (codigo.length !== 6) {
      setError('El codigo tiene 6 digitos')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const usuario = await verificarOTP(email, codigo)
      setUsuario(usuario)
      await cargarPerfil()
      onVerificado()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Codigo invalido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen>
      <SafeAreaView className="flex-1">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Icono */}
          <View className="items-center mb-8">
            <View className="h-20 w-20 rounded-3xl bg-green-100 dark:bg-green-900/40 items-center justify-center mb-4">
              <Ionicons name="mail-open-outline" size={40} color="#16a34a" />
            </View>
            <H1>Revisa tu email</H1>
            <Subtle className="mt-2 text-center">
              Enviamos un codigo de 6 digitos a
            </Subtle>
            <Text className="text-base font-bold text-brand-600 dark:text-brand-400 mt-1">
              {email}
            </Text>
          </View>

          {/* Input de codigo */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2 text-center">
              Ingresa el codigo
            </Text>
            <TextInput
              ref={inputRef}
              value={codigo}
              onChangeText={t => {
                setCodigo(t.replace(/[^0-9]/g, '').slice(0, 6))
                setError(null)
              }}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
              className="text-center text-4xl font-bold tracking-[12px] text-stone-900 dark:text-white bg-stone-100 dark:bg-stone-800 rounded-2xl py-4 px-6"
              placeholder="------"
              placeholderTextColor="#a8a29e"
              onSubmitEditing={verificar}
            />
            <Subtle className="text-center mt-2">El codigo expira en 10 minutos</Subtle>
          </View>

          {/* Error */}
          {error && (
            <View className="flex-row items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 px-3 py-2.5 mb-4">
              <Ionicons name="alert-circle" size={18} color="#dc2626" />
              <Text className="flex-1 text-sm text-red-700 dark:text-red-300">{error}</Text>
            </View>
          )}

          {/* Botones */}
          <Button
            onPress={verificar}
            loading={loading}
            size="lg"
            fullWidth
            disabled={codigo.length !== 6}
          >
            Confirmar codigo
          </Button>

          <View className="flex-row items-center justify-center gap-1 mt-4">
            <Subtle>¿No llego?</Subtle>
            <Text
              className="text-brand-600 dark:text-brand-400 font-semibold text-sm"
              onPress={onVolver}
            >
              Intentar de nuevo
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Screen>
  )
}

// ─── Pantalla principal de registro ──────────────────────────────────────────

export default function RegistroScreen() {
  const [nombre,       setNombre]       = useState('')
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

  async function crear() {
    setLoading(true)
    setError(null)
    try {
      const result = await registrar({ nombre, email, password })

      if (result.emailConfirmRequired) {
        // Supabase manda OTP — mostrar pantalla de ingreso de codigo
        setPendingEmail(email.trim().toLowerCase())
        return
      }

      // Sin confirmacion de email requerida (config de Supabase sin confirmacion)
      router.replace('/')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al crear cuenta')
    } finally {
      setLoading(false)
    }
  }

  // Mostrar pantalla OTP si estamos esperando confirmacion
  if (pendingEmail) {
    return (
      <PantallaOTP
        email={pendingEmail}
        onVerificado={() => router.replace('/')}
        onVolver={() => {
          setPendingEmail(null)
          setError(null)
        }}
      />
    )
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <SafeAreaView className="flex-1">
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="items-center mb-8">
              <View className="h-20 w-20 rounded-3xl bg-brand-600 items-center justify-center mb-4">
                <Text className="text-4xl">✨</Text>
              </View>
              <H1>Crear cuenta</H1>
              <Subtle className="mt-1">Empeza a planificar en segundos</Subtle>
            </View>

            <View className="gap-4">
              <Input
                label="Nombre"
                value={nombre}
                onChangeText={setNombre}
                placeholder="Como te llamas"
              />
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
                placeholder="Minimo 6 caracteres"
              />

              {error && (
                <View className="flex-row items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 px-3 py-2.5">
                  <Ionicons name="alert-circle" size={18} color="#dc2626" />
                  <Text className="flex-1 text-sm text-red-700 dark:text-red-300">{error}</Text>
                </View>
              )}

              <Button onPress={crear} loading={loading} size="lg" fullWidth>
                Crear cuenta
              </Button>

              <View className="flex-row items-center justify-center gap-1 mt-2">
                <Subtle>¿Ya tenes cuenta?</Subtle>
                <Link href="/auth/login" className="text-brand-600 font-semibold text-sm">
                  Iniciar sesion
                </Link>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Screen>
  )
}
