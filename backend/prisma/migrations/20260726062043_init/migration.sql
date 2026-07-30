-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ORGANIZADOR', 'JUGADOR');

-- CreateEnum
CREATE TYPE "EstadoPartido" AS ENUM ('pendiente', 'jugado');

-- CreateEnum
CREATE TYPE "FormatoCompetencia" AS ENUM ('liga');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'ORGANIZADOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clubes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clubes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "torneos" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "deporte" TEXT NOT NULL,
    "formato" "FormatoCompetencia" NOT NULL DEFAULT 'liga',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "torneos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipos" (
    "id" TEXT NOT NULL,
    "torneoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "equipos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jugadores" (
    "id" TEXT NOT NULL,
    "equipoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "jugadores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partidos" (
    "id" TEXT NOT NULL,
    "torneoId" TEXT NOT NULL,
    "jornada" INTEGER NOT NULL,
    "localId" TEXT NOT NULL,
    "visitanteId" TEXT NOT NULL,
    "estado" "EstadoPartido" NOT NULL DEFAULT 'pendiente',
    "golesLocal" INTEGER,
    "golesVisitante" INTEGER,

    CONSTRAINT "partidos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "clubes" ADD CONSTRAINT "clubes_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "torneos" ADD CONSTRAINT "torneos_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipos" ADD CONSTRAINT "equipos_torneoId_fkey" FOREIGN KEY ("torneoId") REFERENCES "torneos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jugadores" ADD CONSTRAINT "jugadores_equipoId_fkey" FOREIGN KEY ("equipoId") REFERENCES "equipos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partidos" ADD CONSTRAINT "partidos_torneoId_fkey" FOREIGN KEY ("torneoId") REFERENCES "torneos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partidos" ADD CONSTRAINT "partidos_localId_fkey" FOREIGN KEY ("localId") REFERENCES "equipos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partidos" ADD CONSTRAINT "partidos_visitanteId_fkey" FOREIGN KEY ("visitanteId") REFERENCES "equipos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
