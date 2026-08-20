-- CreateTable
CREATE TABLE "transfer_parities" (
    "id" TEXT NOT NULL,
    "from_program_id" TEXT NOT NULL,
    "to_program_id" TEXT NOT NULL,
    "from_points" INTEGER NOT NULL DEFAULT 1,
    "to_points" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "transfer_parities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transfer_parities_from_program_id_to_program_id_key" ON "transfer_parities"("from_program_id", "to_program_id");

-- AddForeignKey
ALTER TABLE "transfer_parities" ADD CONSTRAINT "transfer_parities_from_program_id_fkey" FOREIGN KEY ("from_program_id") REFERENCES "loyalty_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_parities" ADD CONSTRAINT "transfer_parities_to_program_id_fkey" FOREIGN KEY ("to_program_id") REFERENCES "loyalty_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
