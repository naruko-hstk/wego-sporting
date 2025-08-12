/*
  Warnings:

  - Changed the type of `gender` on the `team_member` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('M', 'F');

-- Add temporary column
ALTER TABLE "public"."team_member" ADD COLUMN "gender_new" "public"."Gender";

-- Convert existing data: male/M -> M, female/F -> F, 男 -> M, 女 -> F
UPDATE "public"."team_member" 
SET "gender_new" = CASE 
  WHEN "gender" IN ('male', 'M', '男') THEN 'M'::"public"."Gender"
  WHEN "gender" IN ('female', 'F', '女') THEN 'F'::"public"."Gender"
  ELSE 'M'::"public"."Gender"  -- default fallback
END;

-- Make the new column NOT NULL
ALTER TABLE "public"."team_member" ALTER COLUMN "gender_new" SET NOT NULL;

-- Drop the old column and rename the new one
ALTER TABLE "public"."team_member" DROP COLUMN "gender";
ALTER TABLE "public"."team_member" RENAME COLUMN "gender_new" TO "gender";
