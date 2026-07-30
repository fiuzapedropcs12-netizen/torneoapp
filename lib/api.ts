import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * URL base de la API. Se toma de la variable de entorno EXPO_PUBLIC_API_URL
 * (ver .env en la raíz del proyecto de la app). Como el celular con Expo Go
 * no puede resolver "localhost" (eso apuntaría al propio celular), acá debe
 * ir la IP de la PC en la red local, ej: http://192.168.0.15:3000
 */
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

const TOKEN_KEY = 'torneoapp_token'

let tokenEnMemoria: string | null = null

export async function getToken(): Promise<string | null> {
  if (tokenEnMemoria !== null) return tokenEnMemoria
  tokenEnMemoria = await AsyncStorage.getItem(TOKEN_KEY)
  return tokenEnMemoria
}

export async function setToken(token: string | null) {
  tokenEnMemoria = token
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token)
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY)
  }
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers })
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. Verificá tu conexión.')
  }

  if (response.status === 204) return undefined as T

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new ApiError(response.status, data.error ?? 'Ocurrió un error inesperado')
  }

  return data as T
}

// ── Auth ───────────────────────────────────────────────────────────────────

export type Rol = 'ORGANIZADOR' | 'JUGADOR'
export type AuthUser = { id: string; email: string; nombre: string; rol: Rol }
export type AuthResponse = { token: string; user: AuthUser }

export const authApi = {
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (email: string, password: string, nombre: string, rol: Rol) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, nombre, rol }),
    }),
}

// ── Torneos ────────────────────────────────────────────────────────────────

export type TorneoResumen = {
  id: string
  ownerId: string
  nombre: string
  deporte: string
  formato: string
  rondaInicial?: string | null
  campeonId?: string | null
  _count?: { equipos: number }
}

export type PartidoApi = {
  id: string
  jornada: number
  ronda?: string | null
  orden?: number | null
  localId: string
  visitanteId: string
  estado: 'pendiente' | 'jugado'
  golesLocal: number | null
  golesVisitante: number | null
  ganadorPenalesId?: string | null
  fecha: string | null
}

export type EquipoApi = {
  id: string
  torneoId: string
  nombre: string
  _count?: { jugadores: number }
}

export type FilaTablaApi = {
  equipoId: string
  pj: number
  pg: number
  pe: number
  pp: number
  gf: number
  gc: number
  dif: number
  pts: number
}

export type TorneoDetalleApi = TorneoResumen & {
  equipos: EquipoApi[]
  partidos: PartidoApi[]
  tabla: FilaTablaApi[]
}

export const torneosApi = {
  list: () => request<TorneoResumen[]>('/torneos'),
  get: (torneoId: string) => request<TorneoDetalleApi>(`/torneos/${torneoId}`),
  create: (nombre: string, deporte: string, formato: 'liga' | 'eliminatoria' = 'liga', rondaInicial?: string) =>
    request<TorneoResumen>('/torneos', {
      method: 'POST',
      body: JSON.stringify({ nombre, deporte, formato, rondaInicial }),
    }),
  update: (torneoId: string, data: { nombre?: string; deporte?: string }) =>
    request<TorneoResumen>(`/torneos/${torneoId}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (torneoId: string) => request<void>(`/torneos/${torneoId}`, { method: 'DELETE' }),
  generarFixture: (torneoId: string) =>
    request<PartidoApi[]>(`/torneos/${torneoId}/fixture`, { method: 'POST' }),
}

// ── Equipos y jugadores ──────────────────────────────────────────────────────

export type JugadorApi = { id: string; equipoId: string; nombre: string }
export type EquipoDetalleApi = EquipoApi & {
  jugadores: JugadorApi[]
  limite: { titulares: number; maxSuplentes: number; maxJugadores: number }
}

export const equiposApi = {
  get: (equipoId: string) => request<EquipoDetalleApi>(`/equipos/${equipoId}`),
  create: (torneoId: string, nombre: string) =>
    request<EquipoApi>('/equipos', { method: 'POST', body: JSON.stringify({ torneoId, nombre }) }),
  update: (equipoId: string, nombre: string) =>
    request<EquipoApi>(`/equipos/${equipoId}`, { method: 'PUT', body: JSON.stringify({ nombre }) }),
  delete: (equipoId: string) => request<void>(`/equipos/${equipoId}`, { method: 'DELETE' }),
  addJugador: (equipoId: string, nombre: string) =>
    request<JugadorApi>(`/equipos/${equipoId}/jugadores`, { method: 'POST', body: JSON.stringify({ nombre }) }),
  deleteJugador: (jugadorId: string) =>
    request<void>(`/equipos/jugadores/${jugadorId}`, { method: 'DELETE' }),
  getHistorial: (equipoId: string) => request<PartidoHistorialApi[]>(`/equipos/${equipoId}/historial`),
  getJugador: (jugadorId: string) => request<JugadorDetalleApi>(`/equipos/jugadores/${jugadorId}`),
  getHistorialJugador: (jugadorId: string) =>
    request<HistorialJugadorApi>(`/equipos/jugadores/${jugadorId}/historial`),
}

// ── Historial y estadísticas individuales (E3 — RF-10 / RF-11) ──────────────

export type EstadisticaPartidoApi = { goles: number; asistencias: number; atajadas: number }

export type PartidoHistorialApi = {
  id: string
  jornada: number
  estado: 'pendiente' | 'jugado'
  fecha: string | null
  golesLocal: number | null
  golesVisitante: number | null
  local: { id: string; nombre: string }
  visitante: { id: string; nombre: string }
  estadisticas?: EstadisticaPartidoApi | null
}

export type TotalesJugadorApi = {
  goles: number
  asistencias: number
  atajadas: number
  partidosJugados: number
}

export type HistorialJugadorApi = {
  partidos: PartidoHistorialApi[]
  totales: TotalesJugadorApi
}

export type JugadorDetalleApi = {
  id: string
  nombre: string
  equipoId: string
  equipoNombre: string
  torneoId: string
  torneoNombre: string
}

export type EstadisticaPartidoJugadorApi = {
  jugadorId: string
  nombre: string
  equipoId: string
  goles: number
  asistencias: number
  atajadas: number
}

// ── Partidos ───────────────────────────────────────────────────────────────

export const partidosApi = {
  cargarResultado: (partidoId: string, golesLocal: number, golesVisitante: number, ganadorPenalesId?: string) =>
    request<PartidoApi>(`/partidos/${partidoId}/resultado`, {
      method: 'PUT',
      body: JSON.stringify({ golesLocal, golesVisitante, ganadorPenalesId }),
    }),
  programarFecha: (partidoId: string, fecha: string) =>
    request<PartidoApi>(`/partidos/${partidoId}/fecha`, {
      method: 'PUT',
      body: JSON.stringify({ fecha }),
    }),
  getEstadisticas: (partidoId: string) =>
    request<EstadisticaPartidoJugadorApi[]>(`/partidos/${partidoId}/estadisticas`),
  cargarEstadisticas: (
    partidoId: string,
    filas: { jugadorId: string; goles: number; asistencias: number; atajadas: number }[]
  ) =>
    request<EstadisticaPartidoJugadorApi[]>(`/partidos/${partidoId}/estadisticas`, {
      method: 'PUT',
      body: JSON.stringify(filas),
    }),
}
