-- CreateEnum
CREATE TYPE "RondaEliminatoria" AS ENUM ('octavos', 'cuartos', 'semifinal', 'final');

-- AlterEnum
ALTER TYPE "FormatoCompetencia" ADD VALUE 'eliminatoria';

-- AlterTable
ALTER TABLE "partidos" ADD COLUMN     "ganadorPenalesId" TEXT,
ADD COLUMN     "orden" INTEGER,
ADD COLUMN     "ronda" "RondaEliminatoria";

-- AlterTable
ALTER TABLE "torneos" ADD COLUMN     "rondaInicial" "RondaEliminatoria";

-- AddForeignKey
ALTER TABLE "partidos" ADD CONSTRAINT "partidos_ganadorPenalesId_fkey" FOREIGN KEY ("ganadorPenalesId") REFERENCES "equipos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
