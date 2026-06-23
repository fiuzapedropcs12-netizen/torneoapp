import type { Deporte } from '@/types/torneo'

export const DEPORTES: Deporte[] = ['Fútbol 5', 'Fútbol 9', 'Pádel', 'Básquet', 'Otro']

export type ConfigDeporte = {
  /** Jugadores titulares necesarios para jugar un partido. */
  titulares: number
  /** Máximo de suplentes permitidos por equipo (RN-08: máx 3 para todos los deportes). */
  maxSuplentes: number
}

/**
 * Configuración de cada deporte.
 * Regla de negocio RN-08: ningún deporte puede superar 3 suplentes.
 * Para E3 se expande con formatos, posiciones y estadísticas por deporte.
 */
export const DEPORTES_CONFIG: Record<Deporte, ConfigDeporte> = {
  'Fútbol 5': { titulares: 5, maxSuplentes: 3 },
  'Fútbol 9': { titulares: 9, maxSuplentes: 3 },
  'Pádel':    { titulares: 2, maxSuplentes: 0 },
  'Básquet':  { titulares: 5, maxSuplentes: 3 },
  'Otro':     { titulares: 5, maxSuplentes: 3 },
}

/** Cantidad máxima de jugadores por equipo para un deporte dado. */
export function getMaxJugadores(deporte: Deporte): number {
  const { titulares, maxSuplentes } = DEPORTES_CONFIG[deporte]
  return titulares + maxSuplentes
}

/** Cantidad mínima de jugadores por equipo para poder generar el fixture. */
export function getMinJugadores(deporte: Deporte): number {
  return DEPORTES_CONFIG[deporte].titulares
}
