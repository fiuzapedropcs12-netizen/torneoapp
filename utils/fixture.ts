import type { Equipo, Partido } from '@/types/torneo'

type EquipoOBye = Equipo | { id: 'bye'; nombre: string }

/**
 * Genera un fixture round-robin para los equipos dados.
 * Algoritmo de rotación circular: se fija el primer equipo y se rotan los demás.
 * Para N par: N-1 jornadas, N/2 partidos por jornada.
 * Para N impar: se agrega un "bye" para convertirlo en par.
 */
export function generarFixture(equipos: Equipo[]): Partido[] {
  const lista: EquipoOBye[] = [...equipos]

  // Si la cantidad es impar, agregar un "bye" para equilibrar
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

      // Omitir partidos donde alguno de los dos es el "bye"
      if (local.id !== 'bye' && visitante.id !== 'bye') {
        partidos.push({
          id: `partido-j${jornada}-${i}`,
          jornada,
          local: local as Equipo,
          visitante: visitante as Equipo,
          estado: 'pendiente',
        })
      }
    }

    // Rotar: mover el último elemento a la posición 1, desplazar el resto hacia la derecha.
    // El elemento en posición 0 permanece fijo.
    const ultimo = lista.splice(N - 1, 1)[0]
    lista.splice(1, 0, ultimo)
  }

  return partidos
}
