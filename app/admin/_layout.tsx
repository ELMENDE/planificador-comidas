import { Ionicons } from '@expo/vector-icons'
import { Redirect, Tabs } from 'expo-router'
import { esAdmin, useAppStore } from '@/store/useAppStore'

export default function AdminLayout() {
  const usuario = useAppStore(s => s.usuario)

  if (!esAdmin(usuario)) {
    return <Redirect href="/" />
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor:   '#ea580c',
        tabBarInactiveTintColor: '#737373',
        headerShown:             true,
        headerTitleStyle:        { fontWeight: '800' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Admin',
          headerTitle: '👑 Panel admin',
          tabBarIcon: ({ color, size }) => <Ionicons name="speedometer" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="usuarios"
        options={{
          title: 'Usuarios',
          headerTitle: '👥 Usuarios',
          tabBarIcon: ({ color, size }) => <Ionicons name="people" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="sistema"
        options={{
          title: 'Sistema',
          headerTitle: '⚙️ Sistema',
          tabBarIcon: ({ color, size }) => <Ionicons name="hardware-chip" color={color} size={size} />,
        }}
      />
    </Tabs>
  )
}
