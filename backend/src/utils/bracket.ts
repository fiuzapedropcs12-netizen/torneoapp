export type RondaEliminatoria = "octavos" | "cuartos" | "semifinal" | "final";

export const RONDAS: RondaEliminatoria[] = ["octavos", "cuartos", "semifinal", "final"];

export const EQUIPOS_POR_RONDA: Record<RondaEliminatoria, number> = {
  octavos: 16,
  cuartos: 8,
  semifinal: 4,
  final: 2,
};

export const LABEL_RONDA: Record<RondaEliminatoria, string> = {
  octavos: "Octavos de Final",
  cuartos: "Cuartos de Final",
  semifinal: "Semifinal",
  final: "Final",
};

export function siguienteRonda(ronda: RondaEliminatoria): RondaEliminatoria | null {
  const i = RONDAS.indexOf(ronda);
  return i === RONDAS.length - 1 ? null : RONDAS[i + 1];
}

export type PartidoBracketGenerado = {
  ronda: RondaEliminatoria;
  orden: number;
  jornada: number;
  localId: string;
  visitanteId: string;
};

/** Empareja equipos en el orden recibido: [0] vs [1], [2] vs [3], etc. */
export function generarBracketInicial(
  equipoIds: string[],
  rondaInicial: RondaEliminatoria
): PartidoBracketGenerado[] {
  const partidos: PartidoBracketGenerado[] = [];
  for (let i = 0; i < equipoIds.length; i += 2) {
    partidos.push({
      ronda: rondaInicial,
      orden: i / 2,
      jornada: 1,
      localId: equipoIds[i],
      visitanteId: equipoIds[i + 1],
    });
  }
  return partidos;
}

type PartidoJugado = {
  localId: string;
  visitanteId: string;
  golesLocal: number | null;
  golesVisitante: number | null;
  ganadorPenalesId: string | null;
};

export function ganadorPartido(p: PartidoJugado): string {
  if (p.ganadorPenalesId) return p.ganadorPenalesId;
  return (p.golesLocal ?? 0) > (p.golesVisitante ?? 0) ? p.localId : p.visitanteId;
}
