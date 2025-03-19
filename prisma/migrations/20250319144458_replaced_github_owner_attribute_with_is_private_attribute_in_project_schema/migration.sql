/*
  Warnings:

  - You are about to drop the column `ownerOfRepo` on the `Project` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Project" DROP COLUMN "ownerOfRepo",
ADD COLUMN     "isPrivate" BOOLEAN NOT NULL DEFAULT false;
