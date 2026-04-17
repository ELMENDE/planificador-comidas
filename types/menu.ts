export type TipoComida = 'desayuno' | 'almuerzo' | 'cena'

export type Unidad =
  | 'g' | 'kg' | 'ml' | 'l'
  | 'unid' | 'taza' | 'cdita' | 'cda'

export type Categoria =
  | 'verduras' | 'frutas' | 'proteinas' | 'lacteos'
  | 'almacen' | 'panaderia' | 'condimentos'

export interface Ingrediente {
  nombre:    string
  cantidad:  number
  unidad:    Unidad
  categoria: Categoria
}

export interface Paso {
  numero:      number
  descripcion: string
}

export interface Receta {
  id?:            string
  nombre:         string
  tipo_comida:    TipoComida
  descripcion:    string
  tiempo_minutos: number
  calorias:       number
  porciones:      number
  ingredientes:   Ingrediente[]
  pasos:          Paso[]
  tags:           string[]
}

export interface DiaMenu {
  dia:      string
  desayuno: Receta
  almuerzo: Receta
  cena:     Receta
}

export interface MenuSemanal {
  id:          string
  generadoAt:  string
  dias:        DiaMenu[]
}

export interface ItemLista extends Ingrediente {
  en_despensa: boolean
  tildado:     boolean
}

export interface ItemDespensa {
  id:        string
  nombre:    string
  cantidad?: number
  unidad?:   Unidad
}

export interface ItemExtra {
  id:        string
  nombre:    string
  cantidad:  number
  unidad:    Unidad
  categoria: Categoria
}

// ---------- Bio / Nutricion ----------

export type Sexo = 'masculino' | 'femenino'
export type NivelActividad =
  | 'sedentario'
  | 'ligero'
  | 'moderado'
  | 'intenso'
  | 'muy_intenso'
export type Objetivo = 'mantener' | 'perder' | 'ganar'

export interface DatosBiometricos {
  edad:            number
  sexo:            Sexo
  peso_kg:         number
  altura_cm:       number
  actividad:       NivelActividad
  objetivo?:       Objetivo
}

// ---------- Perfil de usuario (mapea a tabla `perfiles`) ----------

export interface Perfil {
  id:             string    // = auth user id
  nombre:         string
  emoji:          string
  sexo:           Sexo
  edad:           number
  peso_kg:        number
  altura_cm:      number
  actividad:      NivelActividad
  objetivo:       Objetivo
  restricciones:  string[]
  tdee_cache:     number | null
  onboarding_ok:  boolean
  created_at:     string
  updated_at:     string
}

// ---------- Grupo familiar ----------

export type RolGrupo = 'owner' | 'miembro'

export interface MiembroGrupo {
  grupo_id:  string
  user_id:   string
  rol:       RolGrupo
  apodo:     string | null
  activo:    boolean
  joined_at: string
  // Populados desde join con perfiles:
  perfil?:   Pick<Perfil, 'nombre' | 'emoji' | 'tdee_cache' | 'restricciones'>
}

export interface GrupoFamiliar {
  id:                  string
  nombre:              string
  owner_id:            string
  restricciones_grupo: string[]
  cocinas_preferidas:  string[]
  tiempo_max_coccion:  number
  presupuesto:         number | null
  created_at:          string
  updated_at:          string
  // Populados desde join:
  miembros?:           MiembroGrupo[]
}

export interface Invitacion {
  id:          string
  token:       string
  grupo_id:    string
  creada_por:  string
  expira_at:   string
  usada:       boolean
  usada_por:   string | null
  created_at:  string
  // Populado:
  grupo?:      Pick<GrupoFamiliar, 'nombre'>
}

// ---------- Compat con código viejo (se irá borrando) ----------

/** @deprecated — usar Perfil + GrupoFamiliar en su lugar */
export interface PerfilHogar {
  nombre:             string
  personas:           number
  presupuesto?:       number
  restricciones:      string[]
  cocinas_preferidas: string[]
  tiempo_max_coccion: number
  bio?:               DatosBiometricos
}

export interface MenuGuardado {
  id:          string
  semana:      string
  generadoAt:  string
  menu:        MenuSemanal
  favorito:    boolean
}
