type FilaEstadistica = {
  goles: number;
  asistencias: number;
  atajadas: number;
};

export type TotalesJugador = {
  goles: number;
  asistencias: number;
  atajadas: number;
  partidosJugados: number;
};

export function calcularTotalesJugador(filas: FilaEstadistica[]): TotalesJugador {
  return filas.reduce<TotalesJugador>(
    (acc, f) => ({
      goles: acc.goles + f.goles,
      asistencias: acc.asistencias + f.asistencias,
      atajadas: acc.atajadas + f.atajadas,
      partidosJugados: acc.partidosJugados + 1,
    }),
    { goles: 0, asistencias: 0, atajadas: 0, partidosJugados: 0 }
  );
}
