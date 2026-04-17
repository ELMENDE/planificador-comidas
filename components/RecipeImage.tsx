import { useState } from 'react'
import { Image, View } from 'react-native'
import { imagenReceta } from '@/lib/recipe-images'

interface Props {
  nombre: string
  ancho?: number
  alto?: number
  className?: string
}

/**
 * Muestra una imagen de comida basada en el nombre de la receta.
 * Si falla la carga, muestra un placeholder con gradiente.
 */
export default function RecipeImage({ nombre, ancho = 400, alto = 200, className = '' }: Props) {
  const [error, setError] = useState(false)
  const uri = imagenReceta(nombre, ancho, alto)

  if (error) {
    return (
      <View
        className={`bg-brand-100 dark:bg-brand-900/30 items-center justify-center ${className}`}
        style={{ width: '100%', height: alto / 2 }}
      />
    )
  }

  return (
    <Image
      source={{ uri }}
      className={className}
      style={{ width: '100%', height: alto / 2, borderRadius: 12 }}
      resizeMode="cover"
      onError={() => setError(true)}
    />
  )
}
