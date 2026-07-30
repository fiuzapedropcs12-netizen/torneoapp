type PartidoConResultado = {
  localId: string;
  visitanteId: string;
  estado: "pendiente" | "jugado";
  golesLocal: number | null;
  golesVisitante: number | null;
};

export type FilaTabla = {
  equipoId: string;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dif: number;
  pts: number;
};

export function calcularTabla(
  equipoIds: string[],
  partidos: PartidoConResultado[]
): FilaTabla[] {
  const filas = new Map<string, FilaTabla>();
  for (const id of equipoIds) {
    filas.set(id, { equipoId: id, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dif: 0, pts: 0 });
  }

  for (const p of partidos) {
    if (p.estado !== "jugado" || p.golesLocal == null || p.golesVisitante == null) continue;

    const local = filas.get(p.localId);
    const visitante = filas.get(p.visitanteId);
    if (!local || !visitante) continue;

    local.pj++;
    visitante.pj++;
    local.gf += p.golesLocal;
    local.gc += p.golesVisitante;
    visitante.gf += p.golesVisitante;
    visitante.gc += p.golesLocal;

    if (p.golesLocal > p.golesVisitante) {
      local.pg++;
      local.pts += 3;
      visitante.pp++;
    } else if (p.golesLocal < p.golesVisitante) {
      visitante.pg++;
      visitante.pts += 3;
      local.pp++;
    } else {
      local.pe++;
      visitante.pe++;
      local.pts += 1;
      visitante.pts += 1;
    }
  }

  const resultado = [...filas.values()];
  for (const f of resultado) f.dif = f.gf - f.gc;

  return resultado.sort((a, b) => b.pts - a.pts || b.dif - a.dif || b.gf - a.gf);
}
