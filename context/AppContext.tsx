import React, { createContext, useContext, useEffect, useReducer } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { generarFixture } from '@/utils/fixture'
import { calcularTabla } from '@/utils/tabla'
import type {
  AppAction,
  AppState,
  ConexionEstado,
  Equipo,
  Jugador,
  Torneo,
  Deporte,
} from '@/types/torneo'

// Re-exportar tipos para que los consumidores importen desde aquí
export type { AppState, AppAction, Torneo, Equipo, Jugador, Deporte, ConexionEstado }

// ── Estado inicial ─────────────────────────────────────────────────────────────

const initialState: AppState = {
  torneos: [],
  loading: true,
  error: null,
  conexion: 'en-vivo',
}

// ── Helpers internos ───────────────────────────────────────────────────────────

/** Genera un ID único simple sin dependencias externas. */
function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

/** Recalcula la tabla de un torneo a partir de sus partidos y equipos actuales. */
function recalcularTabla(torneo: Torneo): Torneo {
  const equipoRefs = torneo.equipos.map(({ id, nombre }) => ({ id, nombre }))
  const tabla = calcularTabla(torneo.partidos, equipoRefs)
  return { ...torneo, tabla }
}

/** Aplica una función de transformación al torneo con el id dado. */
function mapTorneo(
  torneos: Torneo[],
  torneoId: string,
  fn: (t: Torneo) => Torneo,
): Torneo[] {
  return torneos.map((t) => (t.id === torneoId ? fn(t) : t))
}

// ── Reducer ────────────────────────────────────────────────────────────────────

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {

    // ── Estado general ─────────────────────────────────────────────────────────

    case 'SET_LOADING':
      return { ...state, loading: action.payload }

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }

    case 'SET_TORNEOS':
      return { ...state, torneos: action.payload, loading: false }

    case 'SET_CONEXION':
      return { ...state, conexion: action.payload }

    // ── Torneos ────────────────────────────────────────────────────────────────

    case 'CREAR_TORNEO': {
      const nuevo: Torneo = {
        id: uid(),
        nombre: action.payload.nombre.trim(),
        deporte: action.payload.deporte,
        formato: 'Liga',
        equipos: [],
        partidos: [],
        tabla: [],
      }
      return { ...state, torneos: [...state.torneos, nuevo] }
    }

    case 'EDITAR_TORNEO': {
      const torneos = mapTorneo(state.torneos, action.payload.torneoId, (t) => ({
        ...t,
        nombre: action.payload.nombre.trim(),
        deporte: action.payload.deporte,
      }))
      return { ...state, torneos }
    }

    case 'ELIMINAR_TORNEO':
      // RN-06: eliminar en cascada (equipos, partidos y resultados van con el torneo)
      return { ...state, torneos: state.torneos.filter((t) => t.id !== action.payload) }

    // ── Equipos ────────────────────────────────────────────────────────────────

    case 'AGREGAR_EQUIPO': {
      const nuevoEquipo: Equipo = {
        id: uid(),
        nombre: action.payload.nombre.trim(),
        jugadores: [],
      }
      const torneos = mapTorneo(state.torneos, action.payload.torneoId, (t) => ({
        ...t,
        equipos: [...t.equipos, nuevoEquipo],
      }))
      return { ...state, torneos }
    }

    case 'EDITAR_EQUIPO': {
      const torneos = mapTorneo(state.torneos, action.payload.torneoId, (t) => ({
        ...t,
        equipos: t.equipos.map((e) =>
          e.id === action.payload.equipoId
            ? { ...e, nombre: action.payload.nombre.trim() }
            : e
        ),
      }))
      return { ...state, torneos }
    }

    case 'ELIMINAR_EQUIPO': {
      // RN-03: solo se puede eliminar si el fixture aún no fue generado
      // (la validación se hace en la UI antes de disparar esta acción)
      const torneos = mapTorneo(state.torneos, action.payload.torneoId, (t) => ({
        ...t,
        equipos: t.equipos.filter((e) => e.id !== action.payload.equipoId),
      }))
      return { ...state, torneos }
    }

    // ── Jugadores ──────────────────────────────────────────────────────────────

    case 'AGREGAR_JUGADOR': {
      const nuevoJugador: Jugador = {
        id: uid(),
        nombre: action.payload.nombre.trim(),
      }
      const torneos = mapTorneo(state.torneos, action.payload.torneoId, (t) => ({
        ...t,
        equipos: t.equipos.map((e) =>
          e.id === action.payload.equipoId
            ? { ...e, jugadores: [...e.jugadores, nuevoJugador] }
            : e
        ),
      }))
      return { ...state, torneos }
    }

    case 'ELIMINAR_JUGADOR': {
      const torneos = mapTorneo(state.torneos, action.payload.torneoId, (t) => ({
        ...t,
        equipos: t.equipos.map((e) =>
          e.id === action.payload.equipoId
            ? { ...e, jugadores: e.jugadores.filter((j) => j.id !== action.payload.jugadorId) }
            : e
        ),
      }))
      return { ...state, torneos }
    }

    // ── Fixture ────────────────────────────────────────────────────────────────

    case 'GENERAR_FIXTURE': {
      const torneos = mapTorneo(state.torneos, action.payload.torneoId, (t) => {
        const partidos = generarFixture(t.equipos)
        return recalcularTabla({ ...t, partidos })
      })
      return { ...state, torneos }
    }

    // ── Resultados ─────────────────────────────────────────────────────────────

    case 'CARGAR_RESULTADO': {
      const torneos = mapTorneo(state.torneos, action.payload.torneoId, (t) => {
        const partidos = t.partidos.map((p) =>
          p.id === action.payload.partidoId
            ? {
                ...p,
                estado: 'jugado' as const,
                golesLocal: action.payload.golesLocal,
                golesVisitante: action.payload.golesVisitante,
              }
            : p
        )
        return recalcularTabla({ ...t, partidos })
      })
      return { ...state, torneos }
    }

    default:
      return state
  }
}

// ── Context ────────────────────────────────────────────────────────────────────

type AppContextValue = {
  state: AppState
  dispatch: React.Dispatch<AppAction>
}

const AppContext = createContext<AppContextValue | null>(null)

// Clave distinta a la de E1 para evitar colisiones con datos persistidos
const STORAGE_KEY = 'torneoapp_v2_torneos'

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Cargar datos persistidos al iniciar
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((guardado) => {
        if (guardado !== null) {
          const torneos: Torneo[] = JSON.parse(guardado)
          dispatch({ type: 'SET_TORNEOS', payload: torneos })
        } else {
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      })
      .catch(() => {
        dispatch({ type: 'SET_ERROR', payload: 'No se pudieron cargar los datos.' })
      })
  }, [])

  // Persistir cada vez que cambian los torneos
  useEffect(() => {
    if (!state.loading) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.torneos)).catch(() => {
        // Error de persistencia no crítico — los datos siguen en memoria
      })
    }
  }, [state.torneos, state.loading])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

// ── Hooks de consumo ───────────────────────────────────────────────────────────

/** Hook base — devuelve todo el estado y el dispatch. */
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp debe usarse dentro de AppProvider')
  return ctx
}

/**
 * Hook derivado — devuelve un torneo específico por id.
 * Si el id no existe devuelve null (la pantalla debe manejar el caso de redirect).
 */
export function useTorneo(torneoId: string) {
  const { state, dispatch } = useApp()
  const torneo = state.torneos.find((t) => t.id === torneoId) ?? null
  return { torneo, dispatch, conexion: state.conexion }
}
