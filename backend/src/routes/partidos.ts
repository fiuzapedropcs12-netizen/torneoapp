import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma/client";
import { requireAuth, requireOrganizador } from "../middleware/auth";
import { siguienteRonda, ganadorPartido } from "../utils/bracket";

export const partidosRouter = Router();

partidosRouter.use(requireAuth);

const resultadoSchema = z.object({
  golesLocal: z.number().int().min(0),
  golesVisitante: z.number().int().min(0),
  ganadorPenalesId: z.string().min(1).optional(),
});

const fechaSchema = z.object({
  fecha: z.string().datetime(),
});

const estadisticasSchema = z.array(
  z.object({
    jugadorId: z.string().min(1),
    goles: z.number().int().min(0),
    asistencias: z.number().int().min(0),
    atajadas: z.number().int().min(0),
  })
);

async function assertOwnerOfPartido(partidoId: string, userId: string) {
  const partido = await prisma.partido.findUnique({
    where: { id: partidoId },
    include: { torneo: true },
  });
  if (!partido) return { ok: false as const, status: 404, error: "Partido no encontrado" };
  if (partido.torneo.ownerId !== userId) {
    return { ok: false as const, status: 403, error: "No sos el organizador de este torneo" };
  }
  return { ok: true as const, partido };
}

// PUT /partidos/:id/resultado — carga o edita el resultado (DT-04: ahora se puede editar)
partidosRouter.put("/:partidoId/resultado", requireOrganizador, async (req, res) => {
  const check = await assertOwnerOfPartido(req.params.partidoId, req.user!.userId);
  if (!check.ok) return res.status(check.status).json({ error: check.error });

  const parsed = resultadoSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Los goles son obligatorios y deben ser >= 0" });

  const { golesLocal, golesVisitante, ganadorPenalesId } = parsed.data;
  const esEliminatoria = check.partido.torneo.formato === "eliminatoria";
  const empatado = golesLocal === golesVisitante;

  let ganadorPenalesFinal: string | null = null;
  if (esEliminatoria && empatado) {
    if (
      !ganadorPenalesId ||
      (ganadorPenalesId !== check.partido.localId && ganadorPenalesId !== check.partido.visitanteId)
    ) {
      return res.status(400).json({ error: "Empate: indicá qué equipo ganó por penales" });
    }
    ganadorPenalesFinal = ganadorPenalesId;
  }

  const partido = await prisma.partido.update({
    where: { id: req.params.partidoId },
    data: { golesLocal, golesVisitante, ganadorPenalesId: ganadorPenalesFinal, estado: "jugado" },
  });

  if (esEliminatoria && partido.ronda) {
    const ronda = partido.ronda;
    const partidosRonda = await prisma.partido.findMany({
      where: { torneoId: partido.torneoId, ronda },
      orderBy: { orden: "asc" },
    });
    const rondaCompleta = partidosRonda.every((p) => p.estado === "jugado");
    const proxima = siguienteRonda(ronda);

    if (rondaCompleta && proxima) {
      const yaGenerada = await prisma.partido.count({ where: { torneoId: partido.torneoId, ronda: proxima } });
      if (yaGenerada === 0) {
        const ganadores = partidosRonda.map((p) => ganadorPartido(p));
        const siguientesPartidos = [];
        for (let i = 0; i < ganadores.length; i += 2) {
          siguientesPartidos.push({
            torneoId: partido.torneoId,
            jornada: partido.jornada + 1,
            orden: i / 2,
            ronda: proxima,
            localId: ganadores[i],
            visitanteId: ganadores[i + 1],
          });
        }
        await prisma.partido.createMany({ data: siguientesPartidos });
      }
    }
  }

  res.json(partido);
});

// PUT /partidos/:id/fecha — programa o reprograma la fecha/hora del partido (RF-12)
partidosRouter.put("/:partidoId/fecha", requireOrganizador, async (req, res) => {
  const check = await assertOwnerOfPartido(req.params.partidoId, req.user!.userId);
  if (!check.ok) return res.status(check.status).json({ error: check.error });

  const parsed = fechaSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "La fecha es obligatoria y debe ser un ISO datetime válido" });

  const partido = await prisma.partido.update({
    where: { id: req.params.partidoId },
    data: { fecha: new Date(parsed.data.fecha) },
  });
  res.json(partido);
});

// GET /partidos/:id/estadisticas — lectura abierta a cualquier rol (RF-11)
partidosRouter.get("/:partidoId/estadisticas", async (req, res) => {
  const partido = await prisma.partido.findUnique({ where: { id: req.params.partidoId } });
  if (!partido) return res.status(404).json({ error: "Partido no encontrado" });

  const estadisticas = await prisma.estadisticaJugador.findMany({
    where: { partidoId: req.params.partidoId },
    include: { jugador: true },
  });

  res.json(
    estadisticas.map((e) => ({
      jugadorId: e.jugadorId,
      nombre: e.jugador.nombre,
      equipoId: e.jugador.equipoId,
      goles: e.goles,
      asistencias: e.asistencias,
      atajadas: e.atajadas,
    }))
  );
});

// PUT /partidos/:id/estadisticas — carga/edita las estadísticas de ambos planteles (RF-11)
partidosRouter.put("/:partidoId/estadisticas", requireOrganizador, async (req, res) => {
  const check = await assertOwnerOfPartido(req.params.partidoId, req.user!.userId);
  if (!check.ok) return res.status(check.status).json({ error: check.error });

  if (check.partido.estado !== "jugado") {
    return res.status(400).json({ error: "Cargá el resultado antes de cargar estadísticas" });
  }

  const parsed = estadisticasSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Estadísticas inválidas" });

  const jugadoresValidos = await prisma.jugador.findMany({
    where: { equipoId: { in: [check.partido.localId, check.partido.visitanteId] } },
    select: { id: true },
  });
  const idsValidos = new Set(jugadoresValidos.map((j) => j.id));

  for (const fila of parsed.data) {
    if (!idsValidos.has(fila.jugadorId)) {
      return res.status(400).json({ error: "Uno de los jugadores no pertenece a este partido" });
    }
  }

  await prisma.$transaction(
    parsed.data.map((fila) =>
      prisma.estadisticaJugador.upsert({
        where: { partidoId_jugadorId: { partidoId: req.params.partidoId, jugadorId: fila.jugadorId } },
        create: { partidoId: req.params.partidoId, ...fila },
        update: {
          goles: fila.goles,
          asistencias: fila.asistencias,
          atajadas: fila.atajadas,
        },
      })
    )
  );

  const estadisticas = await prisma.estadisticaJugador.findMany({
    where: { partidoId: req.params.partidoId },
    include: { jugador: true },
  });

  res.json(
    estadisticas.map((e) => ({
      jugadorId: e.jugadorId,
      nombre: e.jugador.nombre,
      equipoId: e.jugador.equipoId,
      goles: e.goles,
      asistencias: e.asistencias,
      atajadas: e.atajadas,
    }))
  );
});
