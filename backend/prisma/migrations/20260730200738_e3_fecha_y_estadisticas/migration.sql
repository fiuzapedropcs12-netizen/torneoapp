-- AlterTable
ALTER TABLE "partidos" ADD COLUMN     "fecha" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "estadisticas_jugador" (
    "id" TEXT NOT NULL,
    "partidoId" TEXT NOT NULL,
    "jugadorId" TEXT NOT NULL,
    "goles" INTEGER NOT NULL DEFAULT 0,
    "asistencias" INTEGER NOT NULL DEFAULT 0,
    "atajadas" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "estadisticas_jugador_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "estadisticas_jugador_partidoId_jugadorId_key" ON "estadisticas_jugador"("partidoId", "jugadorId");

-- AddForeignKey
ALTER TABLE "estadisticas_jugador" ADD CONSTRAINT "estadisticas_jugador_partidoId_fkey" FOREIGN KEY ("partidoId") REFERENCES "partidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estadisticas_jugador" ADD CONSTRAINT "estadisticas_jugador_jugadorId_fkey" FOREIGN KEY ("jugadorId") REFERENCES "jugadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
