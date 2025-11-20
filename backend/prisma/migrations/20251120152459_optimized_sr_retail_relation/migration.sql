/*
  Warnings:

  - You are about to drop the `SalesRepRetailer` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SalesRepRetailer" DROP CONSTRAINT "SalesRepRetailer_retailerId_fkey";

-- DropForeignKey
ALTER TABLE "SalesRepRetailer" DROP CONSTRAINT "SalesRepRetailer_salesRepId_fkey";

-- AlterTable
ALTER TABLE "Retailer" ADD COLUMN     "salesRepId" INTEGER;

-- DropTable
DROP TABLE "SalesRepRetailer";

-- CreateIndex
CREATE INDEX "Retailer_salesRepId_idx" ON "Retailer"("salesRepId");

-- AddForeignKey
ALTER TABLE "Retailer" ADD CONSTRAINT "Retailer_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "SalesRep"("id") ON DELETE SET NULL ON UPDATE CASCADE;
