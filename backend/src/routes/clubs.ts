import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma/client";
import { requireAuth, requireOrganizador } from "../middleware/auth";

export const clubsRouter = Router();

clubsRouter.use(requireAuth);

// GET /clubes — todos los clubes visibles (lectura abierta a cualquier rol autenticado)
clubsRouter.get("/", async (_req, res) => {
  const clubes = await prisma.club.findMany({
    include: { _count: { select: { torneos: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(clubes);
});

clubsRouter.get("/:clubId", async (req, res) => {
  const club = await prisma.club.findUnique({
    where: { id: req.params.clubId },
    include: { torneos: true },
  });
  if (!club) return res.status(404).json({ error: "Club no encontrado" });
  res.json(club);
});

const clubSchema = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().optional(),
});

// POST /clubes — solo ORGANIZADOR puede crear clubes
clubsRouter.post("/", requireOrganizador, async (req, res) => {
  const parsed = clubSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const club = await prisma.club.create({
    data: { ...parsed.data, ownerId: req.user!.userId },
  });
  res.status(201).json(club);
});

async function assertOwner(clubId: string, userId: string) {
  const club = await prisma.club.findUnique({ where: { id: clubId } });
  if (!club) return { ok: false as const, status: 404, error: "Club no encontrado" };
  if (club.ownerId !== userId) {
    return { ok: false as const, status: 403, error: "Solo el dueño del club puede modificarlo" };
  }
  return { ok: true as const };
}

clubsRouter.put("/:clubId", requireOrganizador, async (req, res) => {
  const check = await assertOwner(req.params.clubId, req.user!.userId);
  if (!check.ok) return res.status(check.status).json({ error: check.error });

  const parsed = clubSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const club = await prisma.club.update({ where: { id: req.params.clubId }, data: parsed.data });
  res.json(club);
});

clubsRouter.delete("/:clubId", requireOrganizador, async (req, res) => {
  const check = await assertOwner(req.params.clubId, req.user!.userId);
  if (!check.ok) return res.status(check.status).json({ error: check.error });

  await prisma.club.delete({ where: { id: req.params.clubId } });
  res.status(204).send();
});
