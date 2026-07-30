-- Quitar el concepto de "Club": los torneos ahora pertenecen directamente
-- al usuario organizador que los crea (ownerId), en vez de a un club intermedio.

-- 1) Agregar ownerId como nullable primero, para poder rellenarlo con el
--    owner del club de cada torneo existente.
ALTER TABLE "torneos" ADD COLUMN "ownerId" TEXT;

-- 2) Rellenar ownerId de cada torneo con el ownerId de su club actual.
UPDATE "torneos" t
SET "ownerId" = c."ownerId"
FROM "clubes" c
WHERE t."clubId" = c."id";

-- 3) Ahora que está poblado, hacerlo obligatorio.
ALTER TABLE "torneos" ALTER COLUMN "ownerId" SET NOT NULL;

-- 4) Borrar la FK y columna vieja hacia clubes.
ALTER TABLE "torneos" DROP CONSTRAINT "torneos_clubId_fkey";
ALTER TABLE "torneos" DROP COLUMN "clubId";

-- 5) Borrar la tabla clubes (y su FK hacia users).
ALTER TABLE "clubes" DROP CONSTRAINT "clubes_ownerId_fkey";
DROP TABLE "clubes";

-- 6) Nueva FK: torneos.ownerId -> users.id
ALTER TABLE "torneos" ADD CONSTRAINT "torneos_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
