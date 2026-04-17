import { Ionicons } from '@expo/vector-icons'
import { useEffect, useRef } from 'react'
import { Animated, Text, View } from 'react-native'

import { useNetworkStatus } from '@/lib/useNetworkStatus'

/**
 * Banner que aparece cuando no hay conexion a internet.
 * Se muestra en la parte superior con animacion slide-down.
 * Cuando vuelve la conexion muestra "Conectado" brevemente y desaparece.
 */
export default function OfflineBanner() {
  const isConnected = useNetworkStatus()
  const slideAnim = useRef(new Animated.Value(-60)).current
  const wasOffline = useRef(false)
  const showingReconnect = useRef(false)

  useEffect(() => {
    if (isConnected === null) return // Cargando, no mostrar nada

    if (!isConnected) {
      // Sin conexion — mostrar banner
      wasOffline.current = true
      showingReconnect.current = false
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start()
    } else if (wasOffline.current && !showingReconnect.current) {
      // Reconectado — mostrar brevemente "Conectado" y ocultar
      showingReconnect.current = true
      setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -60,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          wasOffline.current = false
          showingReconnect.current = false
        })
      }, 2000)
    } else if (!wasOffline.current) {
      // Nunca estuvo offline, asegurarse que este oculto
      slideAnim.setValue(-60)
    }
  }, [isConnected])

  // No renderizar nada si nunca estuvo offline y esta conectado
  if (isConnected !== false && !wasOffline.current) return null

  const reconnected = isConnected && wasOffline.current

  return (
    <Animated.View
      style={{ transform: [{ translateY: slideAnim }] }}
      className={`absolute top-0 left-0 right-0 z-50 px-4 py-2.5 flex-row items-center justify-center gap-2 ${
        reconnected
          ? 'bg-green-600'
          : 'bg-neutral-800 dark:bg-neutral-700'
      }`}
    >
      <Ionicons
        name={reconnected ? 'checkmark-circle' : 'cloud-offline'}
        size={16}
        color="#fff"
      />
      <Text className="text-xs font-semibold text-white">
        {reconnected ? 'Conectado' : 'Sin conexion — los cambios se guardan local'}
      </Text>
    </Animated.View>
  )
}
