/*
  Warnings:

  - A unique constraint covering the columns `[gameId,categoryId,registrantUserId]` on the table `registration` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."registration" ALTER COLUMN "teamId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "registration_gameId_categoryId_registrantUserId_key" ON "public"."registration"("gameId", "categoryId", "registrantUserId");
