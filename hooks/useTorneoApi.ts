import { useCallback, useEffect, useState } from 'react'
import { Alert } from 'react-native'
import {
  clubesApi,
  torneosApi,
  equiposApi,
  partidosApi,
  ApiError,
  type ClubResumen,
  type ClubDetalle,
  type TorneoDetalleApi,
  type EquipoDetalleApi,
} from '@/lib/api'
import type { Torneo, Deporte, Equipo, FilaTabla, Partido } from '@/types/torneo'

function mensajeError(e: unknown, fallback: string): string {
  return e instanceof ApiError ? e.message : fallback
}

// ── Adaptador: forma de la API → forma que ya esperan las pantallas (E1/E2) ────

function adaptarTorneo(api: TorneoDetalleApi): Torneo {
  const nombrePorId = new Map(api.equipos.map((e) => [e.id, e.nombre]))

  // La tabla y el fixture no necesitan el detalle de jugadores, solo la cantidad
  // (para el contador en la pestaña Equipos) — se completa al entrar al plantel.
  const equipos: Equipo[] = api.equipos.map((e) => ({
    id: e.id,
    nombre: e.nombre,
    jugadores: Array.from({ length: e._count?.jugadores ?? 0 }, (_, i) => ({ id: `_${i}`, nombre: '' })),
  }))

  const partidos: Partido[] = api.partidos.map((p) => ({
    id: p.id,
    jornada: p.jornada,
    local: { id: p.localId, nombre: nombrePorId.get(p.localId) ?? '?' },
    visitante: { id: p.visitanteId, nombre: nombrePorId.get(p.visitanteId) ?? '?' },
    estado: p.estado,
    golesLocal: p.golesLocal ?? undefined,
    golesVisitante: p.golesVisitante ?? undefined,
  }))

  const tabla: FilaTabla[] = api.tabla.map((f) => ({
    equipo: { id: f.equipoId, nombre: nombrePorId.get(f.equipoId) ?? '?' },
    pj: f.pj,
    pg: f.pg,
    pe: f.pe,
    pp: f.pp,
    gf: f.gf,
    gc: f.gc,
    dif: f.dif,
    pts: f.pts,
  }))

  return {
    id: api.id,
    nombre: api.nombre,
    deporte: api.deporte as Deporte,
    formato: 'Liga',
    equipos,
    partidos,
    tabla,
  }
}

// ── Clubes (home) ────────────────────────────────────────────────────────────

export function useClubes() {
  const [clubes, setClubes] = useState<ClubResumen[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setCargando(true)
    try {
      const data = await clubesApi.list()
      setClubes(data)
      setError(null)
    } catch (e) {
      setError(mensajeError(e, 'No se pudieron cargar los clubes.'))
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  async function crearClub(nombre: string, descripcion?: string) {
    try {
      await clubesApi.create(nombre, descripcion)
      await refetch()
      return true
    } catch (e) {
      Alert.alert('Error', mensajeError(e, 'No se pudo crear el club'))
      return false
    }
  }

  return { clubes, cargando, error, refetch, crearClub }
}

// ── Club (detalle: lista de torneos) ─────────────────────────────────────────

export function useClub(clubId: string) {
  const [club, setClub] = useState<ClubDetalle | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setCargando(true)
    try {
      const data = await clubesApi.get(clubId)
      setClub(data)
      setError(null)
    } catch (e) {
      setError(mensajeError(e, 'No se pudo cargar el club.'))
    } finally {
      setCargando(false)
    }
  }, [clubId])

  useEffect(() => {
    refetch()
  }, [refetch])

  async function crearTorneo(nombre: string, deporte: string) {
    try {
      await torneosApi.create(clubId, nombre, deporte)
      await refetch()
      return true
    } catch (e) {
      Alert.alert('Error', mensajeError(e, 'No se pudo crear el torneo'))
      return false
    }
  }

  async function eliminarClub() {
    try {
      await clubesApi.delete(clubId)
      return true
    } catch (e) {
      Alert.alert('Error', mensajeError(e, 'No se pudo eliminar el club'))
      return false
    }
  }

  return { club, cargando, error, refetch, crearTorneo, eliminarClub }
}

// ── Torneo (detalle: tabla / fixture / equipos) ──────────────────────────────

/** Acciones equivalentes a las de E1/E2, ahora resueltas contra la API. */
export type TorneoAction =
  | { type: 'ELIMINAR_TORNEO'; payload: string }
  | { type: 'EDITAR_TORNEO'; payload: { torneoId: string; nombre: string; deporte: Deporte } }
  | { type: 'AGREGAR_EQUIPO'; payload: { torneoId: string; nombre: string } }
  | { type: 'EDITAR_EQUIPO'; payload: { torneoId: string; equipoId: string; nombre: string } }
  | { type: 'ELIMINAR_EQUIPO'; payload: { torneoId: string; equipoId: string } }
  | { type: 'GENERAR_FIXTURE'; payload: { torneoId: string } }
  | {
      type: 'CARGAR_RESULTADO'
      payload: { torneoId: string; partidoId: string; golesLocal: number; golesVisitante: number }
    }

export function useTorneo(torneoId: string) {
  const [torneo, setTorneo] = useState<Torneo | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setCargando(true)
    try {
      const data = await torneosApi.get(torneoId)
      setTorneo(adaptarTorneo(data))
      setError(null)
    } catch (e) {
      setError(mensajeError(e, 'No se pudo cargar el torneo.'))
    } finally {
      setCargando(false)
    }
  }, [torneoId])

  useEffect(() => {
    refetch()
  }, [refetch])

  async function dispatch(action: TorneoAction) {
    try {
      switch (action.type) {
        case 'ELIMINAR_TORNEO':
          await torneosApi.delete(action.payload)
          return // no refetch: el torneo ya no existe
        case 'EDITAR_TORNEO':
          await torneosApi.update(action.payload.torneoId, {
            nombre: action.payload.nombre,
            deporte: action.payload.deporte,
          })
          break
        case 'AGREGAR_EQUIPO':
          await equiposApi.create(action.payload.torneoId, action.payload.nombre)
          break
        case 'EDITAR_EQUIPO':
          await equiposApi.update(action.payload.equipoId, action.payload.nombre)
          break
        case 'ELIMINAR_EQUIPO':
          await equiposApi.delete(action.payload.equipoId)
          break
        case 'GENERAR_FIXTURE':
          await torneosApi.generarFixture(action.payload.torneoId)
          break
        case 'CARGAR_RESULTADO':
          await partidosApi.cargarResultado(
            action.payload.partidoId,
            action.payload.golesLocal,
            action.payload.golesVisitante
          )
          break
      }
      await refetch()
    } catch (e) {
      Alert.alert('Error', mensajeError(e, 'Ocurrió un error inesperado'))
    }
  }

  return { torneo, cargando, error, dispatch, refetch, conexion: 'en-vivo' as const }
}

// ── Equipo (detalle: plantel de jugadores) ───────────────────────────────────

export type EquipoAction =
  | { type: 'AGREGAR_JUGADOR'; payload: { nombre: string } }
  | { type: 'ELIMINAR_JUGADOR'; payload: { jugadorId: string } }

export function useEquipo(equipoId: string) {
  const [equipo, setEquipo] = useState<EquipoDetalleApi | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setCargando(true)
    try {
      const data = await equiposApi.get(equipoId)
      setEquipo(data)
      setError(null)
    } catch (e) {
      setError(mensajeError(e, 'No se pudo cargar el equipo.'))
    } finally {
      setCargando(false)
    }
  }, [equipoId])

  useEffect(() => {
    refetch()
  }, [refetch])

  async function dispatch(action: EquipoAction) {
    try {
      switch (action.type) {
        case 'AGREGAR_JUGADOR':
          await equiposApi.addJugador(equipoId, action.payload.nombre)
          break
        case 'ELIMINAR_JUGADOR':
          await equiposApi.deleteJugador(action.payload.jugadorId)
          break
      }
      await refetch()
    } catch (e) {
      Alert.alert('Error', mensajeError(e, 'Ocurrió un error inesperado'))
    }
  }

  return { equipo, cargando, error, dispatch, refetch }
}
