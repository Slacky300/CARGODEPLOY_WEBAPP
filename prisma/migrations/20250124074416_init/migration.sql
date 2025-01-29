-- DropForeignKey
ALTER TABLE "Log" DROP CONSTRAINT "Log_deploymentId_fkey";

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "Deployment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
