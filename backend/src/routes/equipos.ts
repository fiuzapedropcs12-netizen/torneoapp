import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma/client";
import { requireAuth, requireOrganizador } from "../middleware/auth";
import { calcularTotalesJugador } from "../utils/estadisticas";

export const equiposRouter = Router();

equiposRouter.use(requireAuth);

const LIMITES_DEPORTE: Record<string, { titulares: number; maxSuplentes: number }> = {
  "Fútbol 5": { titulares: 5, maxSuplentes: 3 },
  "Fútbol 9": { titulares: 9, maxSuplentes: 3 },
  "Pádel": { titulares: 2, maxSuplentes: 0 },
  "Básquet": { titulares: 5, maxSuplentes: 3 },
  Otro: { titulares: 5, maxSuplentes: 3 },
};

async function assertOwnerOfEquipo(equipoId: string, userId: string) {
  const equipo = await prisma.equipo.findUnique({
    where: { id: equipoId },
    include: { torneo: true },
  });
  if (!equipo) return { ok: false as const, status: 404, error: "Equipo no encontrado" };
  if (equipo.torneo.ownerId !== userId) {
    return { ok: false as const, status: 403, error: "No sos el organizador de este torneo" };
  }
  return { ok: true as const, equipo };
}

const equipoSchema = z.object({
  torneoId: z.string().min(1),
  nombre: z.string().min(1),
});

// RN: no permitir nombre de equipo duplicado dentro del mismo torneo (resuelve DT-05 de E2)
equiposRouter.post("/", requireOrganizador, async (req, res) => {
  const parsed = equipoSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const torneo = await prisma.torneo.findUnique({ where: { id: parsed.data.torneoId } });
  if (!torneo) return res.status(404).json({ error: "Torneo no encontrado" });
  if (torneo.ownerId !== req.user!.userId) {
    return res.status(403).json({ error: "No sos el organizador de este torneo" });
  }

  const duplicado = await prisma.equipo.findFirst({
    where: { torneoId: parsed.data.torneoId, nombre: parsed.data.nombre },
  });
  if (duplicado) {
    return res.status(409).json({ error: "Ya existe un equipo con ese nombre en el torneo" });
  }

  const equipo = await prisma.equipo.create({ data: parsed.data });
  res.status(201).json(equipo);
});

// GET /equipos/jugadores/:jugadorId — detalle de un jugador (RF-10/RF-11)
// Nota: debe registrarse antes de GET /:equipoId para que "jugadores" no matchee ese wildcard.
equiposRouter.get("/jugadores/:jugadorId", async (req, res) => {
  const jugador = await prisma.jugador.findUnique({
    where: { id: req.params.jugadorId },
    include: { equipo: { include: { torneo: true } } },
  });
  if (!jugador) return res.status(404).json({ error: "Jugador no encontrado" });

  res.json({
    id: jugador.id,
    nombre: jugador.nombre,
    equipoId: jugador.equipoId,
    equipoNombre: jugador.equipo.nombre,
    torneoId: jugador.equipo.torneoId,
    torneoNombre: jugador.equipo.torneo.nombre,
  });
});

// GET /equipos/jugadores/:jugadorId/historial — historial de partidos del equipo del jugador
// + sus estadísticas individuales en cada uno (RF-10 "por jugador" + RF-11)
equiposRouter.get("/jugadores/:jugadorId/historial", async (req, res) => {
  const jugador = await prisma.jugador.findUnique({ where: { id: req.params.jugadorId } });
  if (!jugador) return res.status(404).json({ error: "Jugador no encontrado" });

  const partidos = await prisma.partido.findMany({
    where: { OR: [{ localId: jugador.equipoId }, { visitanteId: jugador.equipoId }] },
    include: {
      local: true,
      visitante: true,
      estadisticas: { where: { jugadorId: jugador.id } },
    },
    orderBy: { jornada: "asc" },
  });

  const filas = partidos.map((p) => {
    const stat = p.estadisticas[0] ?? null;
    return {
      id: p.id,
      jornada: p.jornada,
      estado: p.estado,
      fecha: p.fecha,
      golesLocal: p.golesLocal,
      golesVisitante: p.golesVisitante,
      local: { id: p.localId, nombre: p.local.nombre },
      visitante: { id: p.visitanteId, nombre: p.visitante.nombre },
      estadisticas: stat
        ? { goles: stat.goles, asistencias: stat.asistencias, atajadas: stat.atajadas }
        : null,
    };
  });

  const totales = calcularTotalesJugador(
    partidos.flatMap((p) => p.estadisticas)
  );

  res.json({ partidos: filas, totales });
});

equiposRouter.get("/:equipoId", async (req, res) => {
  const equipo = await prisma.equipo.findUnique({
    where: { id: req.params.equipoId },
    include: { jugadores: true, torneo: true },
  });
  if (!equipo) return res.status(404).json({ error: "Equipo no encontrado" });

  const limite = LIMITES_DEPORTE[equipo.torneo.deporte] ?? LIMITES_DEPORTE.Otro;
  const maxJugadores = limite.titulares + limite.maxSuplentes;
  res.json({ ...equipo, limite: { ...limite, maxJugadores } });
});

// GET /equipos/:equipoId/historial — historial de partidos del equipo (RF-10 "por equipo")
equiposRouter.get("/:equipoId/historial", async (req, res) => {
  const partidos = await prisma.partido.findMany({
    where: { OR: [{ localId: req.params.equipoId }, { visitanteId: req.params.equipoId }] },
    include: { local: true, visitante: true },
    orderBy: { jornada: "asc" },
  });

  res.json(
    partidos.map((p) => ({
      id: p.id,
      jornada: p.jornada,
      estado: p.estado,
      fecha: p.fecha,
      golesLocal: p.golesLocal,
      golesVisitante: p.golesVisitante,
      local: { id: p.localId, nombre: p.local.nombre },
      visitante: { id: p.visitanteId, nombre: p.visitante.nombre },
    }))
  );
});

equiposRouter.delete("/:equipoId", requireOrganizador, async (req, res) => {
  const check = await assertOwnerOfEquipo(req.params.equipoId, req.user!.userId);
  if (!check.ok) return res.status(check.status).json({ error: check.error });

  await prisma.equipo.delete({ where: { id: req.params.equipoId } });
  res.status(204).send();
});

const jugadorSchema = z.object({ nombre: z.string().min(1) });

// RN-04: rechaza el alta si el equipo ya alcanzó el máximo de jugadores para su deporte
equiposRouter.post("/:equipoId/jugadores", requireOrganizador, async (req, res) => {
  const check = await assertOwnerOfEquipo(req.params.equipoId, req.user!.userId);
  if (!check.ok) return res.status(check.status).json({ error: check.error });

  const parsed = jugadorSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const equipo = await prisma.equipo.findUnique({
    where: { id: req.params.equipoId },
    include: { jugadores: true, torneo: true },
  });
  const limite = LIMITES_DEPORTE[equipo!.torneo.deporte] ?? LIMITES_DEPORTE.Otro;
  const maxJugadores = limite.titulares + limite.maxSuplentes;

  if (equipo!.jugadores.length >= maxJugadores) {
    return res.status(409).json({ error: `El equipo ya alcanzó el máximo de ${maxJugadores} jugadores` });
  }

  const jugador = await prisma.jugador.create({
    data: { equipoId: req.params.equipoId, nombre: parsed.data.nombre },
  });
  res.status(201).json(jugador);
});

equiposRouter.delete("/jugadores/:jugadorId", requireOrganizador, async (req, res) => {
  const jugador = await prisma.jugador.findUnique({
    where: { id: req.params.jugadorId },
    include: { equipo: { include: { torneo: true } } },
  });
  if (!jugador) return res.status(404).json({ error: "Jugador no encontrado" });
  if (jugador.equipo.torneo.ownerId !== req.user!.userId) {
    return res.status(403).json({ error: "No sos el organizador de este torneo" });
  }

  await prisma.jugador.delete({ where: { id: req.params.jugadorId } });
  res.status(204).send();
});
