/**
 * Tokens de diseno centralizados.
 * Usados por componentes que no pueden expresar todo via clases tailwind
 * (sombras complejas, gradientes, animaciones, etc).
 */
export const colors = {
  brand: {
    50:  '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },
  neutral: {
    0:   '#ffffff',
    50:  '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },
  success: '#16a34a',
  danger:  '#dc2626',
  warning: '#f59e0b',
  info:    '#0ea5e9',
} as const

export const shadows = {
  sm: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius:  2,
    elevation:     1,
  },
  md: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius:  8,
    elevation:     3,
  },
  lg: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius:  16,
    elevation:     6,
  },
  brand: {
    shadowColor:   '#ea580c',
    shadowOffset:  { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius:  12,
    elevation:     8,
  },
} as const

export const radii = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  '2xl': 24,
  full: 9999,
} as const
