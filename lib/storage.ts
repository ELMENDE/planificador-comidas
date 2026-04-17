import AsyncStorage from '@react-native-async-storage/async-storage'

export const STORAGE_KEYS = {
  tildados: 'compras_tildadas_v1',
  tema:     'tema_app_v1',
} as const

export async function guardarTildados(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.tildados, JSON.stringify(ids))
}

export async function leerTildados(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.tildados)
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return [] }
}
