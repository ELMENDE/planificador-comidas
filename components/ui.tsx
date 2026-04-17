import { ReactNode } from 'react'
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native'
import { shadows } from '@/lib/theme'

// ---------- Button ----------
interface ButtonProps {
  onPress?:  () => void
  children:  ReactNode
  loading?:  boolean
  disabled?: boolean
  variant?:  'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?:     'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

export function Button({
  onPress, children, loading, disabled,
  variant = 'primary', size = 'md', fullWidth = false,
}: ButtonProps) {
  const base = 'rounded-2xl flex-row items-center justify-center'
  const sz = {
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-5 py-4',
  }[size]
  const vr = {
    primary:   'bg-brand-600 active:bg-brand-700',
    secondary: 'bg-neutral-100 dark:bg-white/[0.08] active:bg-neutral-200 dark:active:bg-white/[0.12]',
    ghost:     'bg-transparent active:opacity-60',
    danger:    'bg-red-600 active:bg-red-700',
    outline:   'bg-transparent border border-brand-600 active:bg-brand-50',
  }[variant]
  const txt = {
    primary:   'text-white font-semibold',
    secondary: 'text-neutral-900 dark:text-neutral-100 font-semibold',
    ghost:     'text-brand-600 font-semibold',
    danger:    'text-white font-semibold',
    outline:   'text-brand-600 font-semibold',
  }[variant]
  const txtSize = { sm: 'text-sm', md: 'text-base', lg: 'text-base' }[size]

  const style: ViewStyle | undefined =
    variant === 'primary' && !disabled && !loading ? shadows.brand : undefined

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={style}
      className={`${base} ${sz} ${vr} ${fullWidth ? 'w-full' : ''} ${(disabled || loading) ? 'opacity-50' : ''}`}
    >
      {loading && <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? '#fff' : '#ea580c'} className="mr-2" />}
      <Text className={`${txt} ${txtSize}`}>{children}</Text>
    </Pressable>
  )
}

// ---------- Card ----------
interface CardProps extends ViewProps {
  children: ReactNode
  className?: string
  elevated?: boolean
}

export function Card({ children, className = '', elevated = false, style, ...rest }: CardProps) {
  return (
    <View
      style={[elevated ? shadows.md : shadows.sm, style]}
      className={`rounded-2xl bg-white dark:bg-[#15151b] border border-neutral-200/60 dark:border-white/[0.06] p-4 ${className}`}
      {...rest}
    >
      {children}
    </View>
  )
}

// ---------- Chip ----------
interface ChipProps {
  label:    string
  selected: boolean
  onPress:  () => void
  icon?:    ReactNode
}

export function Chip({ label, selected, onPress, icon }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-1 rounded-full px-3.5 py-2 border ${
        selected
          ? 'bg-brand-600 border-brand-600'
          : 'bg-white dark:bg-[#15151b] border-neutral-300 dark:border-white/[0.08]'
      }`}
    >
      {icon}
      <Text className={`text-sm ${selected ? 'text-white font-semibold' : 'text-neutral-800 dark:text-neutral-200'}`}>
        {label}
      </Text>
    </Pressable>
  )
}

// ---------- Input ----------
interface InputProps extends TextInputProps {
  label?: string
  error?: string
  className?: string
}

export function Input({ label, error, className = '', style, ...rest }: InputProps) {
  return (
    <View className="gap-1.5">
      {label && (
        <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          {label}
        </Text>
      )}
      <TextInput
        placeholderTextColor="#9ca3af"
        className={`rounded-2xl border ${error ? 'border-red-400' : 'border-neutral-300 dark:border-neutral-800'} bg-white dark:bg-neutral-900 px-4 text-neutral-900 dark:text-neutral-100 ${className}`}
        // Padding e altura expresados por fuera de Tailwind: NativeWind puede
        // setear un lineHeight implicito que corta descenders (letras "j", "g",
        // "p") en iOS. Con estilos inline garantizamos fontSize=16,
        // lineHeight=22 y padding vertical holgado.
        style={[
          {
            fontSize: 16,
            lineHeight: 22,
            paddingTop: 14,
            paddingBottom: 14,
            minHeight: 52,
          },
          style,
        ]}
        {...rest}
      />
      {error && <Text className="text-xs text-red-600">{error}</Text>}
    </View>
  )
}

// ---------- Screen ----------
export function Screen({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <View className={`flex-1 bg-neutral-50 dark:bg-[#0b0b10] ${className}`}>
      {children}
    </View>
  )
}

// ---------- Headings ----------
export function H1({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <Text className={`text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight ${className}`}>
      {children}
    </Text>
  )
}

export function H2({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <Text className={`text-lg font-bold text-neutral-900 dark:text-neutral-100 ${className}`}>
      {children}
    </Text>
  )
}

export function Subtle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <Text className={`text-sm text-neutral-500 dark:text-neutral-400 ${className}`}>
      {children}
    </Text>
  )
}

// ---------- EmptyState ----------
export function EmptyState({
  icon, title, message, action,
}: {
  icon: string
  title: string
  message: string
  action?: ReactNode
}) {
  return (
    <View className="flex-1 items-center justify-center p-8">
      <View className="h-20 w-20 rounded-full bg-brand-50 dark:bg-brand-900/30 items-center justify-center mb-4">
        <Text className="text-4xl">{icon}</Text>
      </View>
      <Text className="text-lg font-bold text-neutral-900 dark:text-neutral-100 text-center mb-2">
        {title}
      </Text>
      <Text className="text-sm text-neutral-500 dark:text-neutral-400 text-center mb-6">
        {message}
      </Text>
      {action}
    </View>
  )
}

// ---------- Badge ----------
export function Badge({
  children,
  variant = 'neutral',
}: {
  children: ReactNode
  variant?: 'neutral' | 'brand' | 'success' | 'danger' | 'warning'
}) {
  const cls = {
    neutral: 'bg-neutral-100 dark:bg-neutral-800',
    brand:   'bg-brand-100 dark:bg-brand-900/40',
    success: 'bg-green-100 dark:bg-green-900/40',
    danger:  'bg-red-100  dark:bg-red-900/40',
    warning: 'bg-amber-100 dark:bg-amber-900/40',
  }[variant]
  const txt = {
    neutral: 'text-neutral-700 dark:text-neutral-300',
    brand:   'text-brand-700  dark:text-brand-300',
    success: 'text-green-700  dark:text-green-300',
    danger:  'text-red-700    dark:text-red-300',
    warning: 'text-amber-700  dark:text-amber-300',
  }[variant]
  return (
    <View className={`self-start rounded-full px-2 py-0.5 ${cls}`}>
      <Text className={`text-xs font-semibold ${txt}`}>{children}</Text>
    </View>
  )
}

// ---------- Divider ----------
export function Divider() {
  return <View className="h-px bg-neutral-200 dark:bg-neutral-800 my-2" />
}
