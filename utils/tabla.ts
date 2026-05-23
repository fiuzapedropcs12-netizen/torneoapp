import type { Equipo, FilaTabla, Partido } from '@/types/torneo'

/**
 * Calcula la tabla de posiciones a partir de los partidos jugados.
 * Incluye todos los equipos, incluso los que no jugaron aún (todos en cero).
 * Ordenada por: pts DESC → dif DESC → gf DESC.
 */
export function calcularTabla(partidos: Partido[], equipos: Equipo[]): FilaTabla[] {
  // Inicializar todas las filas en cero
  const mapaFilas = new Map<string, FilaTabla>()
  for (const equipo of equipos) {
    mapaFilas.set(equipo.id, {
      equipo,
      pj: 0,
      pg: 0,
      pe: 0,
      pp: 0,
      gf: 0,
      gc: 0,
      dif: 0,
      pts: 0,
    })
  }

  // Procesar solo partidos jugados
  for (const partido of partidos) {
    if (partido.estado !== 'jugado') continue
    if (partido.golesLocal === undefined || partido.golesVisitante === undefined) continue

    const filaLocal = mapaFilas.get(partido.local.id)
    const filaVisitante = mapaFilas.get(partido.visitante.id)
    if (!filaLocal || !filaVisitante) continue

    const gl = partido.golesLocal
    const gv = partido.golesVisitante

    filaLocal.pj++
    filaVisitante.pj++
    filaLocal.gf += gl
    filaLocal.gc += gv
    filaVisitante.gf += gv
    filaVisitante.gc += gl

    if (gl > gv) {
      filaLocal.pg++
      filaLocal.pts += 3
      filaVisitante.pp++
    } else if (gl < gv) {
      filaVisitante.pg++
      filaVisitante.pts += 3
      filaLocal.pp++
    } else {
      filaLocal.pe++
      filaLocal.pts++
      filaVisitante.pe++
      filaVisitante.pts++
    }
  }

  // Calcular diferencia de goles y ordenar
  const tabla = Array.from(mapaFilas.values()).map((fila) => ({
    ...fila,
    dif: fila.gf - fila.gc,
  }))

  tabla.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts
    if (b.dif !== a.dif) return b.dif - a.dif
    return b.gf - a.gf
  })

  return tabla
}
