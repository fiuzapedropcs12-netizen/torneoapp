import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma/client";
import { requireAuth, requireOrganizador } from "../middleware/auth";
import { generarFixture } from "../utils/fixture";
import { calcularTabla } from "../utils/tabla";

export const torneosRouter = Router();

torneosRouter.use(requireAuth);

async function assertClubOwner(clubId: string, userId: string) {
  const club = await prisma.club.findUnique({ where: { id: clubId } });
  if (!club) return { ok: false as const, status: 404, error: "Club no encontrado" };
  if (club.ownerId !== userId) {
    return { ok: false as const, status: 403, error: "No sos el organizador de este club" };
  }
  return { ok: true as const };
}

const torneoSchema = z.object({
  clubId: z.string().min(1),
  nombre: z.string().min(1),
  deporte: z.string().min(1),
});

// POST /torneos — crea un torneo dentro de un club existente
torneosRouter.post("/", requireOrganizador, async (req, res) => {
  const parsed = torneoSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const check = await assertClubOwner(parsed.data.clubId, req.user!.userId);
  if (!check.ok) return res.status(check.status).json({ error: check.error });

  const torneo = await prisma.torneo.create({ data: parsed.data });
  res.status(201).json(torneo);
});

// GET /torneos/:id — detalle con equipos, partidos y tabla calculada
torneosRouter.get("/:torneoId", async (req, res) => {
  const torneo = await prisma.torneo.findUnique({
    where: { id: req.params.torneoId },
    include: { equipos: true, partidos: true },
  });
  if (!torneo) return res.status(404).json({ error: "Torneo no encontrado" });

  const tabla = calcularTabla(
    torneo.equipos.map((e) => e.id),
    torneo.partidos
  );
  res.json({ ...torneo, tabla });
});

torneosRouter.delete("/:torneoId", requireOrganizador, async (req, res) => {
  const torneo = await prisma.torneo.findUnique({ where: { id: req.params.torneoId } });
  if (!torneo) return res.status(404).json({ error: "Torneo no encontrado" });

  const check = await assertClubOwner(torneo.clubId, req.user!.userId);
  if (!check.ok) return res.status(check.status).json({ error: check.error });

  await prisma.torneo.delete({ where: { id: req.params.torneoId } });
  res.status(204).send();
});

// POST /torneos/:id/fixture — genera el fixture round-robin a partir de los equipos cargados
torneosRouter.post("/:torneoId/fixture", requireOrganizador, async (req, res) => {
  const torneo = await prisma.torneo.findUnique({
    where: { id: req.params.torneoId },
    include: { equipos: true },
  });
  if (!torneo) return res.status(404).json({ error: "Torneo no encontrado" });

  const check = await assertClubOwner(torneo.clubId, req.user!.userId);
  if (!check.ok) return res.status(check.status).json({ error: check.error });

  if (torneo.equipos.length < 2) {
    return res.status(400).json({ error: "Se necesitan al menos 2 equipos para generar el fixture" });
  }

  const yaExiste = await prisma.partido.count({ where: { torneoId: torneo.id } });
  if (yaExiste > 0) {
    return res.status(409).json({ error: "El fixture ya fue generado para este torneo" });
  }

  const generados = generarFixture(torneo.equipos.map((e) => ({ id: e.id })));
  await prisma.partido.createMany({
    data: generados.map((p) => ({
      torneoId: torneo.id,
      jornada: p.jornada,
      localId: p.localId,
      visitanteId: p.visitanteId,
    })),
  });

  const partidos = await prisma.partido.findMany({ where: { torneoId: torneo.id } });
  res.status(201).json(partidos);
});
