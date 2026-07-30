import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../prisma/client";
import { signToken } from "../utils/jwt";

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  nombre: z.string().min(1),
  rol: z.enum(["ORGANIZADOR", "JUGADOR"]).default("ORGANIZADOR"),
});

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { email, password, nombre, rol } = parsed.data;

  const existente = await prisma.user.findUnique({ where: { email } });
  if (existente) {
    return res.status(409).json({ error: "Ya existe una cuenta con ese email" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, nombre, rol },
  });

  const token = signToken({ userId: user.id, rol: user.rol });
  res.status(201).json({
    token,
    user: { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol },
  });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Email y contraseña son requeridos" });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }

  const valido = await bcrypt.compare(password, user.passwordHash);
  if (!valido) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }

  const token = signToken({ userId: user.id, rol: user.rol });
  res.json({
    token,
    user: { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol },
  });
});
