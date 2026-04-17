# 🍽️ Planificador de Comidas

> Generá tu menú semanal personalizado con IA. Lista de compras automática, grupos familiares y sincronización en tiempo real.

<p align="center">
  <img src="https://img.shields.io/badge/Expo-SDK%2054-000020?style=flat-square&logo=expo&logoColor=white" />
  <img src="https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=flat-square&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-Postgres%20%2B%20Realtime-3ECF8E?style=flat-square&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/Claude-3.5%20Sonnet-D97706?style=flat-square" />
  <img src="https://img.shields.io/badge/Tests-60%20passing-22c55e?style=flat-square" />
</p>

---

## ¿Qué es?

Una app móvil (iOS y Android) que usa inteligencia artificial para generar menús semanales adaptados al perfil nutricional de cada usuario. Soporta grupos familiares con sincronización en tiempo real: todos ven el mismo menú, la misma lista de compras, y los cambios se propagan al instante.

## Features

| Feature | Estado |
|---------|--------|
| Menú semanal generado por Claude AI | ✅ |
| Perfil nutricional (TDEE, Harris-Benedict) | ✅ |
| Lista de compras automática con consolidación | ✅ |
| Despensa digital + tildado realtime | ✅ |
| Grupos familiares con invitación por deep link | ✅ |
| "¿Qué cocino con lo que tengo?" | ✅ |
| Historial y favoritos sincronizados | ✅ |
| Reemplazar recetas individuales | ✅ |
| Fotos de recetas (Unsplash, sin API key) | ✅ |
| Notificaciones locales a la hora de comer | ✅ |
| Widget nativo iOS | ✅ |
| Modo offline con banner de estado | ✅ |
| Dark mode | ✅ |
| Borrado de cuenta completo (GDPR) | ✅ |
| Sentry crash reporting | ✅ |
| Analytics propio (Supabase) | ✅ |
| 60 tests unitarios | ✅ |

## Stack

```
Frontend       Expo SDK 54 · React Native 0.81 · expo-router 6
Estilos        NativeWind 4 (Tailwind para RN) · Dark mode nativo
Estado         Zustand 5 + AsyncStorage (persistencia offline)
Backend        Supabase (Postgres · Auth · Realtime · Edge Functions)
IA             Claude 3.5 Sonnet via Supabase Edge Function proxy
Testing        Jest + ts-jest · 60 tests unitarios
Observabilidad Sentry (crashes) · Analytics propio en Supabase
```

## Arquitectura

```
Cliente (RN)  →  lib/claude.ts  →  Edge Function (claude-proxy)  →  Anthropic API
                                          ↓
                                   Supabase DB (RLS)
                                          ↓
                            Supabase Realtime (todos los miembros)
```

- La API key de Anthropic **nunca sale del servidor** (Edge Function secret)
- Todas las tablas tienen **Row Level Security** — un usuario no puede acceder a datos de otro
- Rate limiting en DB: 5 menús/día y 20 reemplazos/día por grupo

## Estructura del proyecto

```
app/
  (tabs)/           # Pantallas principales (menú, despensa, perfil)
  auth/             # Login y registro con verificación OTP
  onboarding.tsx    # Onboarding obligatorio
  receta.tsx        # Detalle de receta
  historial.tsx     # Historial de menús con búsqueda
  favoritos.tsx     # Recetas favoritas con búsqueda
  ajustes.tsx       # Ajustes y notificaciones
  invitar/[token]   # Deep link para unirse a un grupo

components/
  ui/               # Sistema de diseño: Button, Card, Badge, Input…
  MealCard.tsx      # Card de receta con imagen Unsplash
  RecipeImage.tsx   # Imagen con fallback
  OfflineBanner.tsx # Banner animado de conectividad

lib/
  auth.ts           # Registro, login, OTP, borrar cuenta
  analytics.ts      # Eventos de uso (Supabase)
  claude.ts         # Cliente de la API de Claude
  menu-generator.ts # Generación y escalado de menús
  notifications.ts  # Notificaciones locales de comidas
  nutrition.ts      # Harris-Benedict, TDEE, factores
  prompts.ts        # Builders de prompts para Claude
  recipe-images.ts  # URLs de Unsplash por nombre de receta
  sentry.ts         # Crash reporting
  shopping-list.ts  # Consolidación de lista de compras
  sync.ts           # Operaciones de Supabase + Realtime
  widget-data.ts    # Datos para widget nativo iOS

store/
  useAppStore.ts    # Store global con Zustand + persistencia

supabase/
  migrations/       # SQL migrations
  functions/
    claude-proxy/   # Proxy seguro de IA (valida JWT + rate limit)
    delete-account/ # Borrado de cuenta con service_role

__tests__/          # 60 tests unitarios
landing/            # Landing page estática
```

## Setup local

### Requisitos
- Node.js 18+
- Cuenta de Supabase (free tier alcanza)
- API key de Anthropic

### Instalación

```bash
git clone https://github.com/tu-usuario/planificador-comidas
cd planificador-comidas
npm install --legacy-peer-deps
```

### Variables de entorno

```bash
cp .env.example .env
# Completar EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY
```

### Edge Functions

```bash
supabase functions deploy claude-proxy
supabase functions deploy delete-account
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

### Correr la app

```bash
npx expo start
```

## Tests

```bash
npx jest --no-coverage
# → 60 tests passing en 4 suites
```

## Base de datos

| Tabla | Descripción |
|-------|-------------|
| `perfiles` | Datos nutricionales del usuario |
| `grupos` | Grupos familiares |
| `miembros_grupo` | Membresías con roles |
| `invitaciones` | Tokens de invitación |
| `menus` | Menús semanales en JSONB |
| `tildados` | Ítems tachados (realtime) |
| `despensa` | Ingredientes en casa |
| `items_extras` | Ítems manuales en lista |
| `favoritos` | Recetas favoritas |
| `historial_menus` | Historial del grupo |
| `ia_uso` | Rate limiting de Claude |
| `analytics_eventos` | Eventos de uso |

## Roadmap

- [x] Fase 1 — Fundamentos (auth, onboarding, deep linking, offline)
- [x] Fase 2 — Calidad (60 tests, Sentry, analytics)
- [x] Fase 3 — UX (compartir, búsqueda, notificaciones)
- [x] Fase 4 — Features avanzados (IA con despensa, fotos, widget)
- [ ] Fase 5 — Escala (login social, exportar PDF, CI/CD, stores)

---

Proyecto personal en desarrollo activo.
