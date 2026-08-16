/*
  Warnings:

  - You are about to drop the column `riskScore` on the `DeliveryCheck` table. All the data in the column will be lost.
  - Added the required column `aiConfidence` to the `DeliveryCheck` table without a default value. This is not possible if the table is not empty.
  - Added the required column `aiReasons` to the `DeliveryCheck` table without a default value. This is not possible if the table is not empty.
  - Added the required column `decisionSource` to the `DeliveryCheck` table without a default value. This is not possible if the table is not empty.
  - Made the column `ruleEngineScore` on table `DeliveryCheck` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "DeliveryCheck" DROP COLUMN "riskScore",
ADD COLUMN     "aiConfidence" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "aiReasons" JSONB NOT NULL,
ADD COLUMN     "decisionSource" TEXT NOT NULL,
ADD COLUMN     "finalScore" INTEGER,
ALTER COLUMN "ruleEngineScore" SET NOT NULL;
