/*
  Warnings:

  - A unique constraint covering the columns `[registrationId,userPlayerId]` on the table `registration_participant` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."registration_participant" ADD COLUMN     "userPlayerId" TEXT,
ALTER COLUMN "teamMemberId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."team_staff" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "lineId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_player" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" "public"."Gender" NOT NULL,
    "birthday" TIMESTAMP(3) NOT NULL,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "banReason" TEXT,
    "banUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_player_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "registration_participant_registrationId_userPlayerId_key" ON "public"."registration_participant"("registrationId", "userPlayerId");

-- AddForeignKey
ALTER TABLE "public"."registration_participant" ADD CONSTRAINT "registration_participant_userPlayerId_fkey" FOREIGN KEY ("userPlayerId") REFERENCES "public"."user_player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."team_staff" ADD CONSTRAINT "team_staff_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_player" ADD CONSTRAINT "user_player_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
