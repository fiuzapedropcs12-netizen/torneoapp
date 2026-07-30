import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma/client";
import { requireAuth, requireOrganizador } from "../middleware/auth";
import { generarFixture } from "../utils/fixture";
import { calcularTabla } from "../utils/tabla";
import { RONDAS, EQUIPOS_POR_RONDA, LABEL_RONDA, generarBracketInicial, ganadorPartido } from "../utils/bracket";

export const torneosRouter = Router();

torneosRouter.use(requireAuth);

async function assertOwner(torneoId: string, userId: string) {
  const torneo = await prisma.torneo.findUnique({ where: { id: torneoId } });
  if (!torneo) return { ok: false as const, status: 404, error: "Torneo no encontrado" };
  if (torneo.ownerId !== userId) {
    return { ok: false as const, status: 403, error: "No sos el organizador de este torneo" };
  }
  return { ok: true as const, torneo };
}

const torneoSchema = z
  .object({
    nombre: z.string().min(1),
    deporte: z.string().min(1),
    formato: z.enum(["liga", "eliminatoria"]).default("liga"),
    rondaInicial: z.enum(RONDAS as [string, ...string[]]).optional(),
  })
  .refine((data) => data.formato !== "eliminatoria" || data.rondaInicial, {
    message: "Elegí la instancia inicial (octavos, cuartos, semifinal o final)",
    path: ["rondaInicial"],
  })
  .refine((data) => data.formato !== "liga" || !data.rondaInicial, {
    message: "La instancia inicial solo aplica a torneos de eliminatoria",
    path: ["rondaInicial"],
  });

// GET /torneos — todos los torneos visibles (lectura abierta a cualquier rol autenticado)
torneosRouter.get("/", async (_req, res) => {
  const torneos = await prisma.torneo.findMany({
    include: { _count: { select: { equipos: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(torneos);
});

// POST /torneos — crea un torneo propio del organizador autenticado
torneosRouter.post("/", requireOrganizador, async (req, res) => {
  const parsed = torneoSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const { nombre, deporte, formato, rondaInicial } = parsed.data;
  const torneo = await prisma.torneo.create({
    data: {
      nombre,
      deporte,
      formato,
      rondaInicial: formato === "eliminatoria" ? (rondaInicial as any) : null,
      ownerId: req.user!.userId,
    },
  });
  res.status(201).json(torneo);
});

// GET /torneos/:id — detalle con equipos, partidos y tabla (liga) o campeón (eliminatoria)
torneosRouter.get("/:torneoId", async (req, res) => {
  const torneo = await prisma.torneo.findUnique({
    where: { id: req.params.torneoId },
    include: { equipos: true, partidos: true },
  });
  if (!torneo) return res.status(404).json({ error: "Torneo no encontrado" });

  if (torneo.formato === "liga") {
    const tabla = calcularTabla(
      torneo.equipos.map((e) => e.id),
      torneo.partidos
    );
    return res.json({ ...torneo, tabla, campeonId: null });
  }

  const final = torneo.partidos.find((p) => p.ronda === "final" && p.estado === "jugado");
  const campeonId = final ? ganadorPartido(final) : null;
  res.json({ ...torneo, tabla: [], campeonId });
});

torneosRouter.delete("/:torneoId", requireOrganizador, async (req, res) => {
  const check = await assertOwner(req.params.torneoId, req.user!.userId);
  if (!check.ok) return res.status(check.status).json({ error: check.error });

  await prisma.torneo.delete({ where: { id: req.params.torneoId } });
  res.status(204).send();
});

// POST /torneos/:id/fixture — genera el fixture (round-robin o llave de eliminatoria)
torneosRouter.post("/:torneoId/fixture", requireOrganizador, async (req, res) => {
  const check = await assertOwner(req.params.torneoId, req.user!.userId);
  if (!check.ok) return res.status(check.status).json({ error: check.error });

  const torneo = await prisma.torneo.findUnique({
    where: { id: req.params.torneoId },
    include: { equipos: true },
  });
  if (!torneo) return res.status(404).json({ error: "Torneo no encontrado" });

  const yaExiste = await prisma.partido.count({ where: { torneoId: torneo.id } });
  if (yaExiste > 0) {
    return res.status(409).json({ error: "El fixture ya fue generado para este torneo" });
  }

  if (torneo.formato === "eliminatoria") {
    const rondaInicial = torneo.rondaInicial as keyof typeof EQUIPOS_POR_RONDA;
    const requeridos = EQUIPOS_POR_RONDA[rondaInicial];
    if (torneo.equipos.length !== requeridos) {
      return res.status(400).json({
        error: `Este torneo arranca en ${LABEL_RONDA[rondaInicial]}: necesitás exactamente ${requeridos} equipos (tenés ${torneo.equipos.length})`,
      });
    }

    const generados = generarBracketInicial(
      torneo.equipos.map((e) => e.id),
      rondaInicial
    );
    await prisma.partido.createMany({
      data: generados.map((p) => ({
        torneoId: torneo.id,
        jornada: p.jornada,
        orden: p.orden,
        ronda: p.ronda,
        localId: p.localId,
        visitanteId: p.visitanteId,
      })),
    });
  } else {
    if (torneo.equipos.length < 2) {
      return res.status(400).json({ error: "Se necesitan al menos 2 equipos para generar el fixture" });
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
  }

  const partidos = await prisma.partido.findMany({ where: { torneoId: torneo.id } });
  res.status(201).json(partidos);
});
