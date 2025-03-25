-- CreateEnum
CREATE TYPE "ProjectDeploymentStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'SUCCESS', 'FAILED');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "deploymentSuccessful" "ProjectDeploymentStatus" NOT NULL DEFAULT 'PENDING';
