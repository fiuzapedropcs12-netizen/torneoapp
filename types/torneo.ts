// ── Dominio de deportes ────────────────────────────────────────────────────────

export type Deporte = 'Fútbol 5' | 'Fútbol 9' | 'Pádel' | 'Básquet' | 'Otro'

/** Formato del torneo. Para E2 el único valor posible es 'Liga'.
 *  En E3 se habilitará la selección (Eliminación directa, Grupos + playoffs, etc.). */
export type Formato = 'Liga'

// ── Entidades ──────────────────────────────────────────────────────────────────

/** Referencia liviana a un equipo, usada en partidos y tabla para no duplicar
 *  toda la info del equipo (incluyendo jugadores) en cada entrada. */
export type EquipoRef = {
  id: string
  nombre: string
}

/** Jugador dentro de un equipo. En E3 se agregan estadísticas individuales. */
export type Jugador = {
  id: string
  nombre: string
}

/** Equipo con su plantel. En E3 se agrega campo `escudo?: string` (URI de imagen). */
export type Equipo = {
  id: string
  nombre: string
  jugadores: Jugador[]
}

export type Partido = {
  id: string
  jornada: number
  local: EquipoRef
  visitante: EquipoRef
  estado: 'pendiente' | 'jugado'
  golesLocal?: number
  golesVisitante?: number
}

export type FilaTabla = {
  equipo: EquipoRef
  pj: number
  pg: number
  pe: number
  pp: number
  gf: number
  gc: number
  dif: number
  pts: number
}

/** Torneo completo con sus equipos, fixture y tabla. */
export type Torneo = {
  id: string
  nombre: string
  deporte: Deporte
  formato: Formato
  equipos: Equipo[]
  partidos: Partido[]
  tabla: FilaTabla[]
}

// ── Estado global de la app ────────────────────────────────────────────────────

export type ConexionEstado = 'en-vivo' | 'reconectando' | 'sin-conexion'

export type AppState = {
  torneos: Torneo[]
  loading: boolean
  error: string | null
  conexion: ConexionEstado
}

// ── Acciones del reducer ───────────────────────────────────────────────────────

export type AppAction =
  // Estado general
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TORNEOS'; payload: Torneo[] }
  | { type: 'SET_CONEXION'; payload: ConexionEstado }
  // Torneos
  | { type: 'CREAR_TORNEO'; payload: { nombre: string; deporte: Deporte } }
  | { type: 'EDITAR_TORNEO'; payload: { torneoId: string; nombre: string; deporte: Deporte } }
  | { type: 'ELIMINAR_TORNEO'; payload: string }
  // Equipos
  | { type: 'AGREGAR_EQUIPO'; payload: { torneoId: string; nombre: string } }
  | { type: 'EDITAR_EQUIPO'; payload: { torneoId: string; equipoId: string; nombre: string } }
  | { type: 'ELIMINAR_EQUIPO'; payload: { torneoId: string; equipoId: string } }
  // Jugadores
  | { type: 'AGREGAR_JUGADOR'; payload: { torneoId: string; equipoId: string; nombre: string } }
  | { type: 'ELIMINAR_JUGADOR'; payload: { torneoId: string; equipoId: string; jugadorId: string } }
  // Fixture y resultados
  | { type: 'GENERAR_FIXTURE'; payload: { torneoId: string } }
  | { type: 'CARGAR_RESULTADO'; payload: { torneoId: string; partidoId: string; golesLocal: number; golesVisitante: number } }
