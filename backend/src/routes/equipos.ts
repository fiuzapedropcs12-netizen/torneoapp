import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma/client";
import { requireAuth, requireOrganizador } from "../middleware/auth";

export const equiposRouter = Router();

equiposRouter.use(requireAuth);

const LIMITES_DEPORTE: Record<string, { titulares: number; maxSuplentes: number }> = {
  "Fútbol 5": { titulares: 5, maxSuplentes: 3 },
  "Fútbol 9": { titulares: 9, maxSuplentes: 3 },
  "Pádel": { titulares: 2, maxSuplentes: 0 },
  "Básquet": { titulares: 5, maxSuplentes: 3 },
  Otro: { titulares: 5, maxSuplentes: 3 },
};

async function assertClubOwnerOfEquipo(equipoId: string, userId: string) {
  const equipo = await prisma.equipo.findUnique({
    where: { id: equipoId },
    include: { torneo: { include: { club: true } } },
  });
  if (!equipo) return { ok: false as const, status: 404, error: "Equipo no encontrado" };
  if (equipo.torneo.club.ownerId !== userId) {
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

  const torneo = await prisma.torneo.findUnique({
    where: { id: parsed.data.torneoId },
    include: { club: true },
  });
  if (!torneo) return res.status(404).json({ error: "Torneo no encontrado" });
  if (torneo.club.ownerId !== req.user!.userId) {
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

equiposRouter.delete("/:equipoId", requireOrganizador, async (req, res) => {
  const check = await assertClubOwnerOfEquipo(req.params.equipoId, req.user!.userId);
  if (!check.ok) return res.status(check.status).json({ error: check.error });

  await prisma.equipo.delete({ where: { id: req.params.equipoId } });
  res.status(204).send();
});

const jugadorSchema = z.object({ nombre: z.string().min(1) });

// RN-04: rechaza el alta si el equipo ya alcanzó el máximo de jugadores para su deporte
equiposRouter.post("/:equipoId/jugadores", requireOrganizador, async (req, res) => {
  const check = await assertClubOwnerOfEquipo(req.params.equipoId, req.user!.userId);
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
    include: { equipo: { include: { torneo: { include: { club: true } } } } },
  });
  if (!jugador) return res.status(404).json({ error: "Jugador no encontrado" });
  if (jugador.equipo.torneo.club.ownerId !== req.user!.userId) {
    return res.status(403).json({ error: "No sos el organizador de este torneo" });
  }

  await prisma.jugador.delete({ where: { id: req.params.jugadorId } });
  res.status(204).send();
});
