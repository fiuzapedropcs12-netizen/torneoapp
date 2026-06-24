import { useEffect, useRef, useState } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import type { ConexionEstado } from '@/types/torneo'

/**
 * Detecta el estado de conexión de la app usando el ciclo de vida nativo.
 *
 * Comportamiento actual (E2 — sin backend):
 *  - Arranca en 'en-vivo'.
 *  - Cuando la app vuelve al foreground, muestra 'reconectando' por 1.2s
 *    y luego vuelve a 'en-vivo'. Simula la reconexión al servidor.
 *
 * TODO (E3): reemplazar la simulación por el estado real del WebSocket
 *  que se conectará al backend Go:
 *    ws.onopen  → dispatch('en-vivo')
 *    ws.onclose → dispatch('reconectando') + retry con backoff
 *    ws.onerror → dispatch('sin-conexion')
 */
export function useConexion(): ConexionEstado {
  const [estado, setEstado] = useState<ConexionEstado>('en-vivo')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handleAppState = (next: AppStateStatus) => {
      if (next === 'active') {
        // Limpiar timeout anterior por si hay eventos rápidos
        if (timeoutRef.current) clearTimeout(timeoutRef.current)

        setEstado('reconectando')
        timeoutRef.current = setTimeout(() => {
          setEstado('en-vivo')
        }, 1200)
      }
    }

    const sub = AppState.addEventListener('change', handleAppState)

    return () => {
      sub.remove()
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return estado
}
