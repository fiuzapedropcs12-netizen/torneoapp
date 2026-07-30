type EquipoRef = { id: string };

export type PartidoGenerado = {
  jornada: number;
  localId: string;
  visitanteId: string;
};

/**
 * Algoritmo round-robin por rotación circular (mismo criterio que E1/E2
 * en el cliente). Si la cantidad de equipos es impar, se agrega un
 * equipo "bye" ficticio y los partidos contra él se descartan.
 */
export function generarFixture(equipos: EquipoRef[]): PartidoGenerado[] {
  const lista = [...equipos];
  const BYE = "__bye__";
  if (lista.length % 2 !== 0) {
    lista.push({ id: BYE });
  }

  const n = lista.length;
  const jornadas = n - 1;
  const partidos: PartidoGenerado[] = [];

  const fijos = [...lista];
  for (let jornada = 0; jornada < jornadas; jornada++) {
    for (let i = 0; i < n / 2; i++) {
      const local = fijos[i];
      const visitante = fijos[n - 1 - i];
      if (local.id !== BYE && visitante.id !== BYE) {
        partidos.push({
          jornada: jornada + 1,
          localId: jornada % 2 === 0 ? local.id : visitante.id,
          visitanteId: jornada % 2 === 0 ? visitante.id : local.id,
        });
      }
    }
    // Rotar todos menos el primero
    const fixed = fijos[0];
    const rest = fijos.slice(1);
    rest.unshift(rest.pop()!);
    fijos.splice(0, fijos.length, fixed, ...rest);
  }

  return partidos;
}
