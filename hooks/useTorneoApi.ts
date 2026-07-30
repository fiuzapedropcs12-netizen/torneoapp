import { useCallback, useEffect, useState } from 'react'
import { Alert } from 'react-native'
import { router } from 'expo-router'
import {
  torneosApi,
  equiposApi,
  partidosApi,
  ApiError,
  type TorneoResumen,
  type TorneoDetalleApi,
  type EquipoDetalleApi,
  type PartidoHistorialApi,
  type JugadorDetalleApi,
  type TotalesJugadorApi,
  type EstadisticaPartidoJugadorApi,
} from '@/lib/api'
import { sincronizarNotificacionesPartidos } from '@/lib/notifications'
import type { Torneo, Deporte, Formato, Equipo, FilaTabla, Partido, RondaEliminatoria } from '@/types/torneo'

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
    ronda: (p.ronda ?? undefined) as RondaEliminatoria | undefined,
    local: { id: p.localId, nombre: nombrePorId.get(p.localId) ?? '?' },
    visitante: { id: p.visitanteId, nombre: nombrePorId.get(p.visitanteId) ?? '?' },
    estado: p.estado,
    golesLocal: p.golesLocal ?? undefined,
    golesVisitante: p.golesVisitante ?? undefined,
    ganadorPenalesId: p.ganadorPenalesId ?? undefined,
    fecha: p.fecha ?? undefined,
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
    formato: (api.formato === 'eliminatoria' ? 'Eliminatoria' : 'Liga') as Formato,
    rondaInicial: (api.rondaInicial ?? undefined) as RondaEliminatoria | undefined,
    campeonId: api.campeonId ?? undefined,
    equipos,
    partidos,
    tabla,
  }
}

// ── Torneos (home) ────────────────────────────────────────────────────────────

export function useTorneos() {
  const [torneos, setTorneos] = useState<TorneoResumen[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setCargando(true)
    try {
      const data = await torneosApi.list()
      setTorneos(data)
      setError(null)
    } catch (e) {
      setError(mensajeError(e, 'No se pudieron cargar los torneos.'))
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  async function crearTorneo(
    nombre: string,
    deporte: string,
    formato: 'liga' | 'eliminatoria' = 'liga',
    rondaInicial?: RondaEliminatoria
  ) {
    try {
      await torneosApi.create(nombre, deporte, formato, rondaInicial)
      await refetch()
      return true
    } catch (e) {
      Alert.alert('Error', mensajeError(e, 'No se pudo crear el torneo'))
      return false
    }
  }

  return { torneos, cargando, error, refetch, crearTorneo }
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
      payload: {
        torneoId: string
        partidoId: string
        golesLocal: number
        golesVisitante: number
        ganadorPenalesId?: string
      }
    }
  | { type: 'PROGRAMAR_FECHA'; payload: { torneoId: string; partidoId: string; fecha: string } }

export function useTorneo(torneoId: string) {
  const [torneo, setTorneo] = useState<Torneo | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setCargando(true)
    try {
      const data = await torneosApi.get(torneoId)
      const adaptado = adaptarTorneo(data)
      setTorneo(adaptado)
      setError(null)
      sincronizarNotificacionesPartidos(adaptado.partidos)
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
            action.payload.golesVisitante,
            action.payload.ganadorPenalesId
          )
          break
        case 'PROGRAMAR_FECHA':
          await partidosApi.programarFecha(action.payload.partidoId, action.payload.fecha)
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

// ── Historial de equipo (RF-10 "por equipo") ─────────────────────────────────

export function useHistorialEquipo(equipoId: string) {
  const [partidos, setPartidos] = useState<PartidoHistorialApi[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setCargando(true)
    try {
      const data = await equiposApi.getHistorial(equipoId)
      setPartidos(data)
      setError(null)
    } catch (e) {
      setError(mensajeError(e, 'No se pudo cargar el historial.'))
    } finally {
      setCargando(false)
    }
  }, [equipoId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { partidos, cargando, error, refetch }
}

// ── Jugador (detalle + historial + totales — RF-10 "por jugador" / RF-11) ────

export function useJugador(jugadorId: string) {
  const [jugador, setJugador] = useState<JugadorDetalleApi | null>(null)
  const [partidos, setPartidos] = useState<PartidoHistorialApi[]>([])
  const [totales, setTotales] = useState<TotalesJugadorApi | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setCargando(true)
    try {
      const [detalle, historial] = await Promise.all([
        equiposApi.getJugador(jugadorId),
        equiposApi.getHistorialJugador(jugadorId),
      ])
      setJugador(detalle)
      setPartidos(historial.partidos)
      setTotales(historial.totales)
      setError(null)
    } catch (e) {
      setError(mensajeError(e, 'No se pudo cargar el jugador.'))
    } finally {
      setCargando(false)
    }
  }, [jugadorId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { jugador, partidos, totales, cargando, error, refetch }
}

// ── Estadísticas de un partido (RF-11) ────────────────────────────────────────

export function useEstadisticasPartido(partidoId: string, localId: string, visitanteId: string) {
  const [local, setLocal] = useState<EquipoDetalleApi | null>(null)
  const [visitante, setVisitante] = useState<EquipoDetalleApi | null>(null)
  const [estadisticas, setEstadisticas] = useState<EstadisticaPartidoJugadorApi[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const refetch = useCallback(async () => {
    setCargando(true)
    try {
      const [dataLocal, dataVisitante, dataEstadisticas] = await Promise.all([
        equiposApi.get(localId),
        equiposApi.get(visitanteId),
        partidosApi.getEstadisticas(partidoId),
      ])
      setLocal(dataLocal)
      setVisitante(dataVisitante)
      setEstadisticas(dataEstadisticas)
      setError(null)
    } catch (e) {
      setError(mensajeError(e, 'No se pudieron cargar las estadísticas.'))
    } finally {
      setCargando(false)
    }
  }, [partidoId, localId, visitanteId])

  useEffect(() => {
    refetch()
  }, [refetch])

  async function guardar(filas: { jugadorId: string; goles: number; asistencias: number; atajadas: number }[]) {
    setGuardando(true)
    try {
      await partidosApi.cargarEstadisticas(partidoId, filas)
      setGuardando(false)
      router.back()
      return true
    } catch (e) {
      setGuardando(false)
      Alert.alert('Error', mensajeError(e, 'No se pudieron guardar las estadísticas'))
      return false
    }
  }

  return { local, visitante, estadisticas, cargando, error, guardando, guardar, refetch }
}
