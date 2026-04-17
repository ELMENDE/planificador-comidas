import { Ionicons } from '@expo/vector-icons'
import { Redirect, Tabs } from 'expo-router'
import { Platform, useColorScheme } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppStore } from '@/store/useAppStore'

export default function TabsLayout() {
  const usuario          = useAppStore(s => s.usuario)
  const perfil           = useAppStore(s => s.perfil)
  const onboardingHecho  = perfil?.onboarding_ok ?? false
  const insets           = useSafeAreaInsets()
  const tema             = useAppStore(s => s.tema)
  const sistema          = useColorScheme()
  const esOscuro         = tema === 'oscuro' || (tema === 'sistema' && sistema === 'dark')

  if (!usuario) return <Redirect href="/auth/login" />
  if (!onboardingHecho) return <Redirect href="/onboarding" />

  // Altura de la tab bar: contenido (56) + inset inferior (home indicator del iPhone).
  // Si no hay inset (Android sin gesture nav) dejamos 10 de padding para que los
  // botones queden comodos y no pegados al borde.
  const bottomPad = Math.max(insets.bottom, 10)

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor:   '#ea580c',
        tabBarInactiveTintColor: esOscuro ? '#6b7280' : '#9ca3af',
        headerShown:             false,
        tabBarStyle: {
          borderTopWidth:   esOscuro ? 1 : 0,
          borderTopColor:   esOscuro ? 'rgba(255,255,255,0.06)' : 'transparent',
          backgroundColor:  esOscuro ? '#0f0f14' : '#ffffff',
          elevation:        12,
          shadowColor:      '#000',
          shadowOpacity:    esOscuro ? 0 : 0.08,
          shadowRadius:     16,
          shadowOffset:     { width: 0, height: -4 },
          height:           56 + bottomPad,
          paddingTop:       8,
          paddingBottom:    bottomPad,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
        tabBarItemStyle: { paddingVertical: 4 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'restaurant' : 'restaurant-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="compras"
        options={{
          title: 'Compras',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'cart' : 'cart-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="despensa"
        options={{
          title: 'Despensa',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'file-tray-stacked' : 'file-tray-stacked-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  )
}
