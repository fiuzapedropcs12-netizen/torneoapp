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

// ── Estado de conexión (usado por hooks/useConexion.ts) ────────────────────────

export type ConexionEstado = 'en-vivo' | 'reconectando' | 'sin-conexion'

// Nota (E3): AppState/AppAction del reducer local de E1/E2 fueron reemplazados
// por hooks/useTorneoApi.ts, que habla directo con el backend. Ver TorneoAction
// y EquipoAction ahí.
