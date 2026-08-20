-- AlterTable
ALTER TABLE "users" ADD COLUMN     "password_reset_expires_at" TIMESTAMPTZ,
ADD COLUMN     "password_reset_token_hash" TEXT,
ALTER COLUMN "password_hash" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_password_reset_token_hash_key" ON "users"("password_reset_token_hash");

