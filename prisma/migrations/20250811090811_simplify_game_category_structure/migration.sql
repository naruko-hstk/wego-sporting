/*
  Warnings:

  - You are about to drop the column `fullName` on the `game_category` table. All the data in the column will be lost.
  - You are about to drop the column `group` on the `game_category` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `game_category` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `game_category` table. All the data in the column will be lost.
  - You are about to drop the column `weightClass` on the `game_category` table. All the data in the column will be lost.
  - Added the required column `categoryName` to the `game_category` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."game_category" DROP COLUMN "fullName",
DROP COLUMN "group",
DROP COLUMN "level",
DROP COLUMN "type",
DROP COLUMN "weightClass",
ADD COLUMN     "categoryName" TEXT NOT NULL,
ADD COLUMN     "conditions" TEXT;
