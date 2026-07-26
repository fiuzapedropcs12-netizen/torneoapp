import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma/client";
import { requireAuth, requireOrganizador } from "../middleware/auth";

export const partidosRouter = Router();

partidosRouter.use(requireAuth);

const resultadoSchema = z.object({
  golesLocal: z.number().int().min(0),
  golesVisitante: z.number().int().min(0),
});

async function assertClubOwnerOfPartido(partidoId: string, userId: string) {
  const partido = await prisma.partido.findUnique({
    where: { id: partidoId },
    include: { torneo: { include: { club: true } } },
  });
  if (!partido) return { ok: false as const, status: 404, error: "Partido no encontrado" };
  if (partido.torneo.club.ownerId !== userId) {
    return { ok: false as const, status: 403, error: "No sos el organizador de este torneo" };
  }
  return { ok: true as const };
}

// PUT /partidos/:id/resultado — carga o edita el resultado (DT-04: ahora se puede editar)
partidosRouter.put("/:partidoId/resultado", requireOrganizador, async (req, res) => {
  const check = await assertClubOwnerOfPartido(req.params.partidoId, req.user!.userId);
  if (!check.ok) return res.status(check.status).json({ error: check.error });

  const parsed = resultadoSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Los goles son obligatorios y deben ser >= 0" });

  const partido = await prisma.partido.update({
    where: { id: req.params.partidoId },
    data: { ...parsed.data, estado: "jugado" },
  });
  res.json(partido);
});
