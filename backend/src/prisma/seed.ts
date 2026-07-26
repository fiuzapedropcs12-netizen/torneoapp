import bcrypt from "bcryptjs";
import { prisma } from "./client";

async function main() {
  const passwordHash = await bcrypt.hash("torneo123", 10);

  const organizador = await prisma.user.upsert({
    where: { email: "organizador@torneoapp.com" },
    update: {},
    create: {
      email: "organizador@torneoapp.com",
      passwordHash,
      nombre: "Organizador Demo",
      rol: "ORGANIZADOR",
    },
  });

  await prisma.user.upsert({
    where: { email: "jugador@torneoapp.com" },
    update: {},
    create: {
      email: "jugador@torneoapp.com",
      passwordHash,
      nombre: "Jugador Demo",
      rol: "JUGADOR",
    },
  });

  const club = await prisma.club.create({
    data: {
      nombre: "Club Relámpago FRLP",
      descripcion: "Club demo para la Entrega 3",
      ownerId: organizador.id,
    },
  });

  const torneo = await prisma.torneo.create({
    data: { clubId: club.id, nombre: "Torneo Relámpago 2026", deporte: "Fútbol 5" },
  });

  const nombres = ["Equipo 1", "Equipo 2", "Equipo 3", "Equipo 4", "Equipo 5", "Equipo 6"];
  for (const nombre of nombres) {
    await prisma.equipo.create({ data: { torneoId: torneo.id, nombre } });
  }

  console.log("Seed completado:");
  console.log("  organizador@torneoapp.com / torneo123");
  console.log("  jugador@torneoapp.com / torneo123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
