/*
  Warnings:

  - You are about to drop the column `email` on the `SalesRep` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `SalesRep` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `SalesRep` table. All the data in the column will be lost.
  - You are about to drop the `Admin` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId]` on the table `SalesRep` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `SalesRep` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Admin', 'SalesRep');

-- DropForeignKey
ALTER TABLE "Area" DROP CONSTRAINT "Area_regionId_fkey";

-- DropForeignKey
ALTER TABLE "Retailer" DROP CONSTRAINT "Retailer_areaId_fkey";

-- DropForeignKey
ALTER TABLE "Retailer" DROP CONSTRAINT "Retailer_distributorId_fkey";

-- DropForeignKey
ALTER TABLE "Retailer" DROP CONSTRAINT "Retailer_regionId_fkey";

-- DropForeignKey
ALTER TABLE "Retailer" DROP CONSTRAINT "Retailer_territoryId_fkey";

-- DropForeignKey
ALTER TABLE "Territory" DROP CONSTRAINT "Territory_areaId_fkey";

-- DropIndex
DROP INDEX "SalesRep_email_key";

-- DropIndex
DROP INDEX "SalesRep_phone_key";

-- DropIndex
DROP INDEX "SalesRep_username_key";

-- AlterTable
ALTER TABLE "Retailer" ADD COLUMN     "notes" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "SalesRep" DROP COLUMN "email",
DROP COLUMN "phone",
DROP COLUMN "username",
ADD COLUMN     "userId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "Admin";

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "Retailer_regionId_idx" ON "Retailer"("regionId");

-- CreateIndex
CREATE INDEX "Retailer_areaId_idx" ON "Retailer"("areaId");

-- CreateIndex
CREATE INDEX "Retailer_distributorId_idx" ON "Retailer"("distributorId");

-- CreateIndex
CREATE INDEX "Retailer_territoryId_idx" ON "Retailer"("territoryId");

-- CreateIndex
CREATE INDEX "Retailer_name_idx" ON "Retailer"("name");

-- CreateIndex
CREATE INDEX "Retailer_phone_idx" ON "Retailer"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "SalesRep_userId_key" ON "SalesRep"("userId");

-- CreateIndex
CREATE INDEX "SalesRepRetailer_retailerId_idx" ON "SalesRepRetailer"("retailerId");

-- CreateIndex
CREATE INDEX "SalesRepRetailer_salesRepId_idx" ON "SalesRepRetailer"("salesRepId");

-- AddForeignKey
ALTER TABLE "Area" ADD CONSTRAINT "Area_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Territory" ADD CONSTRAINT "Territory_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Retailer" ADD CONSTRAINT "Retailer_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Retailer" ADD CONSTRAINT "Retailer_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Retailer" ADD CONSTRAINT "Retailer_distributorId_fkey" FOREIGN KEY ("distributorId") REFERENCES "Distributor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Retailer" ADD CONSTRAINT "Retailer_territoryId_fkey" FOREIGN KEY ("territoryId") REFERENCES "Territory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesRep" ADD CONSTRAINT "SalesRep_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
