import NetInfo from '@react-native-community/netinfo'
import { useEffect, useState } from 'react'

/**
 * Hook que monitorea el estado de la conexion.
 * Devuelve `true` si hay internet, `false` si no, `null` mientras carga.
 */
export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? null)
    })
    return () => unsubscribe()
  }, [])

  return isConnected
}
