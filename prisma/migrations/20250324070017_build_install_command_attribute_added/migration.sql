-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "buildCommand" TEXT DEFAULT 'npm run build',
ADD COLUMN     "installCommand" TEXT DEFAULT 'npm install';
