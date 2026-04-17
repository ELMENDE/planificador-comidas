import { View } from 'react-native'
import type { DiaMenu } from '@/types/menu'
import MealCard from './MealCard'

interface Props {
  dia:      DiaMenu
  diaIndex: number
}

export default function DayView({ dia, diaIndex }: Props) {
  return (
    <View className="gap-3">
      <MealCard receta={dia.desayuno} tipo="desayuno" diaIndex={diaIndex} />
      <MealCard receta={dia.almuerzo} tipo="almuerzo" diaIndex={diaIndex} />
      <MealCard receta={dia.cena}     tipo="cena"     diaIndex={diaIndex} />
    </View>
  )
}
