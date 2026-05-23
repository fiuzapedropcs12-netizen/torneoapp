export type Equipo = {
  id: string
  nombre: string
}

export type Partido = {
  id: string
  jornada: number
  local: Equipo
  visitante: Equipo
  estado: 'pendiente' | 'jugado'
  golesLocal?: number
  golesVisitante?: number
}

export type FilaTabla = {
  equipo: Equipo
  pj: number
  pg: number
  pe: number
  pp: number
  gf: number
  gc: number
  dif: number
  pts: number
}

export type TorneoState = {
  nombre: string
  deporte: string
  equipos: Equipo[]
  partidos: Partido[]
  tabla: FilaTabla[]
  loading: boolean
  error: string | null
}

export type TorneoAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PARTIDOS'; payload: Partido[] }
  | { type: 'CARGAR_RESULTADO'; payload: { partidoId: string; golesLocal: number; golesVisitante: number } }
