import { ActivityIndicator, Modal, Text, View } from 'react-native'

interface Props {
  visible:  boolean
  mensaje?: string
}

export default function LoadingOverlay({ visible, mensaje }: Props) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View className="flex-1 items-center justify-center bg-black/60">
        <View
          className="rounded-3xl bg-white dark:bg-[#15151b] border border-transparent dark:border-white/[0.06] px-10 py-8 items-center gap-4 mx-8"
          style={{
            shadowColor:  '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3,
            shadowRadius: 24,
            elevation:    12,
          }}
        >
          <View className="h-16 w-16 rounded-full bg-brand-50 dark:bg-brand-900/40 items-center justify-center">
            <ActivityIndicator size="large" color="#ea580c" />
          </View>
          <Text className="text-base font-bold text-neutral-900 dark:text-neutral-100 text-center">
            {mensaje ?? 'Cargando…'}
          </Text>
          <Text className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
            Esto puede tardar unos segundos
          </Text>
        </View>
      </View>
    </Modal>
  )
}
