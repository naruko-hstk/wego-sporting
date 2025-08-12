-- CreateTable
CREATE TABLE "public"."account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."activity_log" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "userId" TEXT,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."game" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "venue" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "signupStart" TIMESTAMP(3) NOT NULL,
    "signupEnd" TIMESTAMP(3) NOT NULL,
    "gameStart" TIMESTAMP(3) NOT NULL,
    "gameEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."game_category" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "level" TEXT,
    "weightClass" TEXT,
    "fullName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."game_detail" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "basis" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."game_fee" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "categoryId" TEXT,
    "feeType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_fee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."registration" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "registrantUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "note" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."registration_participant" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "teamMemberId" TEXT NOT NULL,
    "isMainPlayer" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registration_participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "impersonatedBy" TEXT,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."team_member" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "birthday" TIMESTAMP(3) NOT NULL,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "banReason" TEXT,
    "banUntil" TIMESTAMP(3),
    "phone" TEXT,
    "lineId" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" TEXT,
    "banned" BOOLEAN,
    "banReason" TEXT,
    "banExpires" TIMESTAMP(3),
    "username" TEXT,
    "displayUsername" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_log_action_idx" ON "public"."activity_log"("action");

-- CreateIndex
CREATE INDEX "activity_log_createdAt_idx" ON "public"."activity_log"("createdAt");

-- CreateIndex
CREATE INDEX "activity_log_entity_idx" ON "public"."activity_log"("entity");

-- CreateIndex
CREATE INDEX "activity_log_userId_idx" ON "public"."activity_log"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "game_detail_gameId_key" ON "public"."game_detail"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "registration_gameId_categoryId_teamId_key" ON "public"."registration"("gameId", "categoryId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "registration_participant_registrationId_teamMemberId_key" ON "public"."registration_participant"("registrationId", "teamMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "public"."session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "public"."user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "public"."user"("username");

-- AddForeignKey
ALTER TABLE "public"."account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."game_category" ADD CONSTRAINT "game_category_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "public"."game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."game_detail" ADD CONSTRAINT "game_detail_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "public"."game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."game_fee" ADD CONSTRAINT "game_fee_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."game_category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."game_fee" ADD CONSTRAINT "game_fee_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "public"."game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."registration" ADD CONSTRAINT "registration_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."game_category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."registration" ADD CONSTRAINT "registration_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "public"."game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."registration" ADD CONSTRAINT "registration_registrantUserId_fkey" FOREIGN KEY ("registrantUserId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."registration" ADD CONSTRAINT "registration_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."registration_participant" ADD CONSTRAINT "registration_participant_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "public"."registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."registration_participant" ADD CONSTRAINT "registration_participant_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "public"."team_member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."team" ADD CONSTRAINT "team_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."team_member" ADD CONSTRAINT "team_member_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
