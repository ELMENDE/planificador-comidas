import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { obtenerPerfil, actualizarPerfil } from '@/lib/auth'
import { registrarEvento, EVENTOS } from '@/lib/analytics'
import { misGrupos } from '@/lib/grupos'
import { calcularTDEE } from '@/lib/nutrition'
import { programarNotificacionesMenu } from '@/lib/notifications'
import { actualizarWidgetData } from '@/lib/widget-data'
import {
  cargarTildados,
  tildar,
  destildar,
  limpiarTildadosGrupo,
  cargarDespensa,
  agregarDespensaRemoto,
  quitarDespensaRemoto,
  cargarItemsExtras,
  agregarItemExtraRemoto,
  quitarItemExtraRemoto,
  cargarMenuActual,
  guardarMenuRemoto,
  guardarEnHistorial,
  suscribirRealtime,
  desuscribirRealtime,
  cargarFavoritos,
  agregarFavoritoRemoto,
  quitarFavoritoRemoto,
} from '@/lib/sync'
import type {
  GrupoFamiliar,
  ItemDespensa,
  ItemExtra,
  MenuSemanal,
  Perfil,
  Receta,
  TipoComida,
} from '@/types/menu'
import type { Usuario } from '@/lib/auth'

type Tema = 'claro' | 'oscuro' | 'sistema'

interface AppState {
  // Auth
  usuario:      Usuario | null
  authReady:    boolean
  setUsuario:   (u: Usuario | null) => void
  setAuthReady: (b: boolean) => void

  // Perfil del usuario actual (desde Supabase)
  perfil:          Perfil | null
  cargarPerfil:    () => Promise<void>
  guardarPerfil:   (campos: Partial<Perfil>) => Promise<void>

  // Grupos
  grupos:          GrupoFamiliar[]
  grupoActivo:     GrupoFamiliar | null
  menuIdRemoto:    string | null  // ID del menu en Supabase (para tildados)
  cargarGrupos:    () => Promise<void>
  setGrupoActivo:  (g: GrupoFamiliar | null) => void
  cargarDatosGrupo: () => Promise<void>

  // Menu (ahora del grupo activo)
  menuActual:      MenuSemanal | null
  setMenuActual:   (m: MenuSemanal) => void

  // Favoritos (por usuario, synced con Supabase)
  favoritos:             Receta[]
  cargarFavoritosRemoto: () => Promise<void>
  toggleFavoritoReceta:  (r: Receta) => void
  esFavoritoReceta:      (nombre: string) => boolean

  // Tildados — synced con Supabase cuando hay grupo
  tildados:        string[]
  toggleTildado:   (clave: string) => void
  limpiarTildados: () => void

  // Despensa — synced con Supabase cuando hay grupo
  despensa:         ItemDespensa[]
  agregarDespensa:  (item: ItemDespensa) => void
  quitarDespensa:   (id: string) => void

  // Items extras — synced con Supabase cuando hay grupo
  itemsExtras:       ItemExtra[]
  agregarItemExtra:  (item: Omit<ItemExtra, 'id'>) => void
  quitarItemExtra:   (id: string) => void

  // Overrides de cantidades en lista de compras
  overridesCantidad: Record<string, number>
  setOverrideCantidad: (clave: string, cantidad: number | null) => void

  // UI local
  tema:            Tema
  modoMock:        boolean
  notificacionesComida: boolean
  setTema:         (t: Tema) => void
  setModoMock:     (b: boolean) => void
  setNotificacionesComida: (b: boolean) => void

  // Reemplazar receta en menu actual
  reemplazarReceta: (tipo: TipoComida, diaIndex: number, nueva: Receta) => void

  // Reset
  resetTodo:       () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // --- Auth ---
      usuario:     null,
      authReady:   false,
      setUsuario:  u => set({ usuario: u }),
      setAuthReady: b => set({ authReady: b }),

      // --- Perfil ---
      perfil: null,

      cargarPerfil: async () => {
        const u = get().usuario
        if (!u) return
        try {
          const p = await obtenerPerfil(u.id)
          set({ perfil: p as Perfil })
        } catch {
          // Si falla (usuario recién creado), el trigger de DB lo crea
        }
      },

      guardarPerfil: async (campos) => {
        const u = get().usuario
        if (!u) return
        const merged = { ...(get().perfil ?? {}), ...campos }
        if (merged.sexo && merged.peso_kg && merged.altura_cm && merged.edad && merged.actividad) {
          const tdee = calcularTDEE({
            sexo:      merged.sexo,
            peso_kg:   Number(merged.peso_kg),
            altura_cm: Number(merged.altura_cm),
            edad:      Number(merged.edad),
            actividad: merged.actividad,
            objetivo:  merged.objetivo,
          })
          campos = { ...campos, tdee_cache: tdee }
        }
        const updated = await actualizarPerfil(u.id, campos)
        set({ perfil: updated as Perfil })
      },

      // --- Grupos ---
      grupos:        [],
      grupoActivo:   null,
      menuIdRemoto:  null,

      cargarGrupos: async () => {
        try {
          const gs = await misGrupos()
          set({ grupos: gs })
          const activo = get().grupoActivo
          if (!activo && gs.length === 1) {
            get().setGrupoActivo(gs[0])
          } else if (activo) {
            const fresh = gs.find(g => g.id === activo.id)
            if (fresh) set({ grupoActivo: fresh })
          }
        } catch { /* sin conectividad */ }
      },

      setGrupoActivo: g => {
        set({ grupoActivo: g })
        if (g) {
          // Cargar datos del grupo y suscribirse a realtime
          get().cargarDatosGrupo()
        } else {
          desuscribirRealtime()
        }
      },

      /**
       * Carga tildados, despensa, items extras y menu actual desde Supabase
       * para el grupo activo, y activa las suscripciones realtime.
       */
      cargarDatosGrupo: async () => {
        const grupo = get().grupoActivo
        if (!grupo) return

        try {
          const [tildados, despensa, extras, menuResult] = await Promise.all([
            cargarTildados(grupo.id),
            cargarDespensa(grupo.id),
            cargarItemsExtras(grupo.id),
            cargarMenuActual(grupo.id),
          ])

          set({
            tildados,
            despensa,
            itemsExtras:       extras,
            menuActual:        menuResult?.menu ?? get().menuActual,
            menuIdRemoto:      menuResult?.menuId ?? null,
            overridesCantidad: {},
          })
        } catch {
          // Sin conectividad — usamos datos locales
        }

        // Suscripciones realtime
        suscribirRealtime(grupo.id, {
          onTildadosChange:    t => set({ tildados: t }),
          onDespensaChange:    d => set({ despensa: d }),
          onItemsExtrasChange: e => set({ itemsExtras: e }),
          onMenuChange:        m => { if (m) set({ menuActual: m }) },
        })
      },

      // --- Menu ---
      menuActual: null,
      setMenuActual: m => {
        const esPrimero = !get().menuActual
        set({ menuActual: m, tildados: [], overridesCantidad: {} })
        // Registrar evento analytics
        registrarEvento(esPrimero ? EVENTOS.MENU_GENERADO : EVENTOS.MENU_REGENERADO, {
          dias: m.dias.length,
          personas: get().grupoActivo?.miembros?.length ?? 1,
        })
        // Programar notificaciones locales si esta habilitado
        if (get().notificacionesComida) {
          programarNotificacionesMenu(m).catch(() => {})
        }
        // Actualizar datos del widget
        actualizarWidgetData(m).catch(() => {})
        // Si hay grupo activo, guardar en Supabase + historial
        const grupo = get().grupoActivo
        if (grupo) {
          const kcal = m.dias.reduce((s, d) =>
            s + (d.desayuno.calorias || 0) + (d.almuerzo.calorias || 0) + (d.cena.calorias || 0), 0,
          )
          const kcalDia = Math.round(kcal / 7)
          guardarMenuRemoto(grupo.id, m, kcalDia)
            .then(menuId => {
              set({ menuIdRemoto: menuId })
              guardarEnHistorial(grupo.id, menuId).catch(() => {})
            })
            .catch(() => { /* offline fallback */ })
          limpiarTildadosGrupo(grupo.id).catch(() => {})
        }
      },

      // --- Favoritos ---
      favoritos: [],

      cargarFavoritosRemoto: async () => {
        try {
          const favs = await cargarFavoritos()
          set({ favoritos: favs })
        } catch { /* offline — usamos cache local */ }
      },

      toggleFavoritoReceta: r => {
        const s = get()
        const existe = s.favoritos.find(f => f.nombre === r.nombre)

        // Optimistic update
        set({
          favoritos: existe
            ? s.favoritos.filter(f => f.nombre !== r.nombre)
            : [...s.favoritos, { ...r, id: r.id ?? `${Date.now()}` }],
        })

        // Sync con Supabase
        if (existe) {
          quitarFavoritoRemoto(r.nombre).catch(() => {})
        } else {
          agregarFavoritoRemoto(r).catch(() => {})
        }
      },

      esFavoritoReceta: nombre =>
        !!get().favoritos.find(f => f.nombre === nombre),

      // --- Tildados ---
      tildados: [],
      toggleTildado: clave => {
        const s = get()
        const on = s.tildados.includes(clave)

        // Optimistic update local
        set({
          tildados: on
            ? s.tildados.filter(k => k !== clave)
            : [...s.tildados, clave],
        })

        // Sync con Supabase si hay grupo
        const grupo  = s.grupoActivo
        const menuId = s.menuIdRemoto
        if (grupo && menuId) {
          if (on) {
            destildar(grupo.id, clave).catch(() => {})
          } else {
            tildar(grupo.id, menuId, clave).catch(() => {})
          }
        }
      },

      limpiarTildados: () => {
        set({ tildados: [] })
        const grupo = get().grupoActivo
        if (grupo) {
          limpiarTildadosGrupo(grupo.id).catch(() => {})
        }
      },

      // --- Despensa ---
      despensa: [],
      agregarDespensa: item => {
        const grupo = get().grupoActivo
        if (grupo) {
          // Remoto: agregar y dejar que realtime actualice
          agregarDespensaRemoto(grupo.id, {
            nombre:   item.nombre,
            cantidad: item.cantidad,
            unidad:   item.unidad,
          })
            .then(remoto => {
              // Agregar con el ID real de Supabase
              set(s => ({ despensa: [...s.despensa, remoto] }))
            })
            .catch(() => {
              // Fallback local
              set(s => ({ despensa: [...s.despensa, item] }))
            })
        } else {
          set(s => ({ despensa: [...s.despensa, item] }))
        }
      },
      quitarDespensa: id => {
        set(s => ({ despensa: s.despensa.filter(d => d.id !== id) }))
        const grupo = get().grupoActivo
        if (grupo) {
          quitarDespensaRemoto(id).catch(() => {})
        }
      },

      // --- Items extras ---
      itemsExtras: [],
      agregarItemExtra: item => {
        const grupo = get().grupoActivo
        if (grupo) {
          agregarItemExtraRemoto(grupo.id, item as ItemExtra)
            .then(remoto => {
              set(s => ({ itemsExtras: [...s.itemsExtras, remoto] }))
            })
            .catch(() => {
              set(s => ({
                itemsExtras: [...s.itemsExtras, {
                  ...item,
                  id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                } as ItemExtra],
              }))
            })
        } else {
          set(s => ({
            itemsExtras: [...s.itemsExtras, {
              ...item,
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            } as ItemExtra],
          }))
        }
      },
      quitarItemExtra: id => {
        set(s => ({ itemsExtras: s.itemsExtras.filter(e => e.id !== id) }))
        const grupo = get().grupoActivo
        if (grupo) {
          quitarItemExtraRemoto(id).catch(() => {})
        }
      },

      // --- Overrides ---
      overridesCantidad: {},
      setOverrideCantidad: (clave, cantidad) => set(s => {
        const next = { ...s.overridesCantidad }
        if (cantidad === null || Number.isNaN(cantidad)) {
          delete next[clave]
        } else {
          next[clave] = cantidad
        }
        return { overridesCantidad: next }
      }),

      // --- UI ---
      tema:       'sistema',
      modoMock:   true,
      notificacionesComida: false,
      setTema:    t => set({ tema: t }),
      setModoMock: b => set({ modoMock: b }),
      setNotificacionesComida: b => set({ notificacionesComida: b }),

      // --- Recetas ---
      reemplazarReceta: (tipo, diaIndex, nueva) => {
        const menu = get().menuActual
        if (!menu) return
        const dias = menu.dias.map((d, i) => {
          if (i !== diaIndex) return d
          return { ...d, [tipo]: nueva }
        })
        set({ menuActual: { ...menu, dias } })
      },

      // --- Reset ---
      resetTodo: () => {
        desuscribirRealtime()
        set({
          perfil:            null,
          grupos:            [],
          grupoActivo:       null,
          menuActual:        null,
          menuIdRemoto:      null,
          favoritos:         [],
          tildados:          [],
          overridesCantidad: {},
          despensa:          [],
          itemsExtras:       [],
        })
      },
    }),
    {
      name:    'planificador-comidas-v2',
      storage: createJSONStorage(() => AsyncStorage),
      // Solo persistimos estado de UI local — los datos viven en Supabase
      partialize: s => ({
        tema:              s.tema,
        modoMock:          s.modoMock,
        notificacionesComida: s.notificacionesComida,
        favoritos:         s.favoritos,
        tildados:          s.tildados,
        overridesCantidad: s.overridesCantidad,
        menuActual:        s.menuActual,
        despensa:          s.despensa,
        itemsExtras:       s.itemsExtras,
      }),
    },
  ),
)

export const esAdmin = (u: Usuario | null): boolean => false
