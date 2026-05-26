import React, { createContext, useContext, useEffect, useReducer } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { EQUIPOS, TORNEO_DEPORTE, TORNEO_NOMBRE } from '@/constants/data'
import { generarFixture } from '@/utils/fixture'
import { calcularTabla } from '@/utils/tabla'
import type { Equipo, FilaTabla, Partido, TorneoAction, TorneoState } from '@/types/torneo'

// Re-exportar tipos para que los consumidores puedan importar desde aquí
export type { Equipo, FilaTabla, Partido, TorneoAction, TorneoState }

// ── Estado inicial ─────────────────────────────────────────────────────────────

const initialState: TorneoState = {
  nombre: TORNEO_NOMBRE,
  deporte: TORNEO_DEPORTE,
  equipos: EQUIPOS,
  partidos: [],
  tabla: [],
  loading: true,
  error: null,
}

// ── Reducer ────────────────────────────────────────────────────────────────────

function torneoReducer(state: TorneoState, action: TorneoAction): TorneoState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }

    case 'SET_PARTIDOS': {
      const nuevaTabla = calcularTabla(action.payload, state.equipos)
      return { ...state, partidos: action.payload, tabla: nuevaTabla, loading: false }
    }

    case 'CARGAR_RESULTADO': {
      const { partidoId, golesLocal, golesVisitante } = action.payload
      const nuevosPartidos = state.partidos.map((p) =>
        p.id === partidoId
          ? { ...p, estado: 'jugado' as const, golesLocal, golesVisitante }
          : p
      )
      const nuevaTabla = calcularTabla(nuevosPartidos, state.equipos)
      return { ...state, partidos: nuevosPartidos, tabla: nuevaTabla }
    }

    default:
      return state
  }
}

// ── Context ────────────────────────────────────────────────────────────────────

type TorneoContextValue = {
  state: TorneoState
  dispatch: React.Dispatch<TorneoAction>
}

const TorneoContext = createContext<TorneoContextValue | null>(null)

const STORAGE_KEY = 'torneoapp_partidos'

export function TorneoProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(torneoReducer, initialState)

  // Cargar datos al iniciar: intentar recuperar de AsyncStorage, sino generar fixture nuevo
  useEffect(() => {
    const init = async () => {
      try {
        const guardado = await AsyncStorage.getItem(STORAGE_KEY)
        if (guardado !== null) {
          const partidos: Partido[] = JSON.parse(guardado)
          dispatch({ type: 'SET_PARTIDOS', payload: partidos })
        } else {
          const partidos = generarFixture(EQUIPOS)
          dispatch({ type: 'SET_PARTIDOS', payload: partidos })
        }
      } catch {
        dispatch({ type: 'SET_ERROR', payload: 'No se pudo cargar el torneo. Intentá de nuevo.' })
      }
    }
    init()
  }, [])

  // Persistir partidos cada vez que cambian
  useEffect(() => {
    if (!state.loading) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.partidos)).catch(() => {
        // error de persistencia no crítico — se ignora silenciosamente
      })
    }
  }, [state.partidos, state.loading])

  return (
    <TorneoContext.Provider value={{ state, dispatch }}>
      {children}
    </TorneoContext.Provider>
  )
}

export function useTorneo(): TorneoContextValue {
  const context = useContext(TorneoContext)
  if (!context) {
    throw new Error('useTorneo debe usarse dentro de TorneoProvider')
  }
  return context
}
