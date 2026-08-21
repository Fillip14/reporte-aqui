-- AlterTable
ALTER TABLE "problems" ADD COLUMN     "responsibleCompanyId" TEXT;

-- CreateIndex
CREATE INDEX "problems_responsibleCompanyId_idx" ON "problems"("responsibleCompanyId");

-- AddForeignKey
ALTER TABLE "problems" ADD CONSTRAINT "problems_responsibleCompanyId_fkey" FOREIGN KEY ("responsibleCompanyId") REFERENCES "company_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
