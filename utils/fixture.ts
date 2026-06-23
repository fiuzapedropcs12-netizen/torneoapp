import type { Equipo, EquipoRef, Partido } from '@/types/torneo'

type SlotOBye = EquipoRef | { id: 'bye'; nombre: string }

/**
 * Genera un fixture round-robin para los equipos dados.
 * Algoritmo de rotación circular: se fija el primer slot y se rotan los demás.
 * Para N par: N-1 jornadas, N/2 partidos por jornada.
 * Para N impar: se agrega un "bye" para convertirlo en par.
 *
 * Recibe Equipo[] pero solo usa id y nombre para construir los EquipoRef
 * de cada Partido (no almacena la lista de jugadores dentro del fixture).
 */
export function generarFixture(equipos: Equipo[]): Partido[] {
  // Extraer solo la referencia liviana — los jugadores no se almacenan en el fixture
  const lista: SlotOBye[] = equipos.map(({ id, nombre }) => ({ id, nombre }))

  if (lista.length % 2 !== 0) {
    lista.push({ id: 'bye', nombre: 'Libre' })
  }

  const N = lista.length
  const totalJornadas = N - 1
  const partidosPorJornada = N / 2
  const partidos: Partido[] = []

  for (let jornada = 1; jornada <= totalJornadas; jornada++) {
    for (let i = 0; i < partidosPorJornada; i++) {
      const local = lista[i]
      const visitante = lista[N - 1 - i]

      if (local.id !== 'bye' && visitante.id !== 'bye') {
        partidos.push({
          id: `partido-j${jornada}-${i}`,
          jornada,
          local: local as EquipoRef,
          visitante: visitante as EquipoRef,
          estado: 'pendiente',
        })
      }
    }

    // Rotación: el último elemento pasa a la posición 1, el resto se desplaza.
    // El slot en posición 0 queda siempre fijo.
    const ultimo = lista.splice(N - 1, 1)[0]
    lista.splice(1, 0, ultimo)
  }

  return partidos
}
