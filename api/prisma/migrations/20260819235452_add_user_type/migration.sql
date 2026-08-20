-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('GESTAO', 'ASSINANTE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "user_type" "UserType" NOT NULL DEFAULT 'GESTAO';
