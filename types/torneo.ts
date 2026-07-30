// ── Dominio de deportes ────────────────────────────────────────────────────────

export type Deporte = 'Fútbol 5' | 'Fútbol 9' | 'Pádel' | 'Básquet' | 'Otro'

/** Formato del torneo: tabla de posiciones (Liga) o llave de eliminación directa (Eliminatoria). */
export type Formato = 'Liga' | 'Eliminatoria'

/** Instancia de una llave de eliminatoria, de la más temprana a la final. */
export type RondaEliminatoria = 'octavos' | 'cuartos' | 'semifinal' | 'final'

// ── Entidades ──────────────────────────────────────────────────────────────────

/** Referencia liviana a un equipo, usada en partidos y tabla para no duplicar
 *  toda la info del equipo (incluyendo jugadores) en cada entrada. */
export type EquipoRef = {
  id: string
  nombre: string
}

/** Jugador dentro de un equipo (listado liviano). Ver JugadorDetalle para el detalle con estadísticas. */
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
  ronda?: RondaEliminatoria
  local: EquipoRef
  visitante: EquipoRef
  estado: 'pendiente' | 'jugado'
  golesLocal?: number
  golesVisitante?: number
  ganadorPenalesId?: string
  fecha?: string
}

// ── Historial y estadísticas individuales (E3 — RF-10 / RF-11) ─────────────────

/** Estadísticas de un jugador en un partido puntual. */
export type EstadisticaPartido = {
  goles: number
  asistencias: number
  atajadas: number
}

/** Partido dentro de un historial (equipo o jugador), con las stats del jugador si aplica. */
export type PartidoHistorial = {
  id: string
  jornada: number
  estado: 'pendiente' | 'jugado'
  fecha?: string
  golesLocal?: number
  golesVisitante?: number
  local: EquipoRef
  visitante: EquipoRef
  estadisticas?: EstadisticaPartido | null
}

export type TotalesJugador = {
  goles: number
  asistencias: number
  atajadas: number
  partidosJugados: number
}

export type JugadorDetalle = {
  id: string
  nombre: string
  equipoId: string
  equipoNombre: string
  torneoId: string
  torneoNombre: string
}

/** Fila de estadística por jugador, usada al cargar/mostrar estadísticas de un partido. */
export type EstadisticaPartidoJugador = {
  jugadorId: string
  nombre: string
  equipoId: string
  goles: number
  asistencias: number
  atajadas: number
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
  rondaInicial?: RondaEliminatoria
  campeonId?: string
  equipos: Equipo[]
  partidos: Partido[]
  tabla: FilaTabla[]
}

// ── Estado de conexión (usado por hooks/useConexion.ts) ────────────────────────

export type ConexionEstado = 'en-vivo' | 'reconectando' | 'sin-conexion'

// Nota (E3): AppState/AppAction del reducer local de E1/E2 fueron reemplazados
// por hooks/useTorneoApi.ts, que habla directo con el backend. Ver TorneoAction
// y EquipoAction ahí.
