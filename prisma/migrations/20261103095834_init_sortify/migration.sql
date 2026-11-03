-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'PETUGAS', 'SELLER');

-- CreateEnum
CREATE TYPE "PackageStatus" AS ENUM ('WAITING_RES', 'REGISTERED', 'SORTED');

-- CreateEnum
CREATE TYPE "ImportBatchStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'COMPLETED_WITH_ERRORS', 'FAILED');

-- CreateEnum
CREATE TYPE "ImportDetailStatus" AS ENUM ('IMPORTED', 'UPDATED_RES', 'SKIPPED_SAME', 'SKIPPED_DUPLICATE_FILE', 'CONFLICT_ORDER_RES', 'CONFLICT_RES_USED', 'FAILED_EMPTY_ORDER', 'FAILED_INVALID');

-- CreateEnum
CREATE TYPE "ScanMode" AS ENUM ('AUTO', 'MANUAL');

-- CreateEnum
CREATE TYPE "ScanResult" AS ENUM ('SUCCESS', 'UNKNOWN_BARCODE', 'EXPEDITION_MISMATCH', 'PREFIX_UNRECOGNIZED', 'ALREADY_SCANNED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'SELLER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Marketplace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Marketplace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "marketplaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerStore" (
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SellerStore_pkey" PRIMARY KEY ("userId","storeId")
);

-- CreateTable
CREATE TABLE "Expedition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expedition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrefixRule" (
    "id" TEXT NOT NULL,
    "expeditionId" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrefixRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "expeditionId" TEXT,
    "orderNumber" TEXT NOT NULL,
    "barcode" TEXT,
    "status" "PackageStatus" NOT NULL DEFAULT 'WAITING_RES',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "totalSuccess" INTEGER NOT NULL DEFAULT 0,
    "totalFailed" INTEGER NOT NULL DEFAULT 0,
    "totalSkipped" INTEGER NOT NULL DEFAULT 0,
    "status" "ImportBatchStatus" NOT NULL DEFAULT 'PROCESSING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportBatchDetail" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "packageId" TEXT,
    "rowNumber" INTEGER NOT NULL,
    "orderNumber" TEXT,
    "barcode" TEXT,
    "status" "ImportDetailStatus" NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportBatchDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "packageId" TEXT,
    "storeId" TEXT,
    "selectedExpeditionId" TEXT,
    "detectedExpeditionId" TEXT,
    "scannedBarcode" TEXT NOT NULL,
    "mode" "ScanMode" NOT NULL,
    "result" "ScanResult" NOT NULL,
    "message" TEXT,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Marketplace_name_key" ON "Marketplace"("name");

-- CreateIndex
CREATE INDEX "Store_marketplaceId_idx" ON "Store"("marketplaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Store_marketplaceId_name_key" ON "Store"("marketplaceId", "name");

-- CreateIndex
CREATE INDEX "SellerStore_storeId_idx" ON "SellerStore"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "Expedition_name_key" ON "Expedition"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PrefixRule_prefix_key" ON "PrefixRule"("prefix");

-- CreateIndex
CREATE INDEX "PrefixRule_expeditionId_idx" ON "PrefixRule"("expeditionId");

-- CreateIndex
CREATE UNIQUE INDEX "Package_barcode_key" ON "Package"("barcode");

-- CreateIndex
CREATE INDEX "Package_storeId_idx" ON "Package"("storeId");

-- CreateIndex
CREATE INDEX "Package_expeditionId_idx" ON "Package"("expeditionId");

-- CreateIndex
CREATE INDEX "Package_status_idx" ON "Package"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Package_storeId_orderNumber_key" ON "Package"("storeId", "orderNumber");

-- CreateIndex
CREATE INDEX "ImportBatch_userId_idx" ON "ImportBatch"("userId");

-- CreateIndex
CREATE INDEX "ImportBatch_storeId_idx" ON "ImportBatch"("storeId");

-- CreateIndex
CREATE INDEX "ImportBatch_createdAt_idx" ON "ImportBatch"("createdAt");

-- CreateIndex
CREATE INDEX "ImportBatchDetail_packageId_idx" ON "ImportBatchDetail"("packageId");

-- CreateIndex
CREATE INDEX "ImportBatchDetail_status_idx" ON "ImportBatchDetail"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ImportBatchDetail_batchId_rowNumber_key" ON "ImportBatchDetail"("batchId", "rowNumber");

-- CreateIndex
CREATE INDEX "ScanHistory_userId_idx" ON "ScanHistory"("userId");

-- CreateIndex
CREATE INDEX "ScanHistory_packageId_idx" ON "ScanHistory"("packageId");

-- CreateIndex
CREATE INDEX "ScanHistory_storeId_idx" ON "ScanHistory"("storeId");

-- CreateIndex
CREATE INDEX "ScanHistory_scannedAt_idx" ON "ScanHistory"("scannedAt");

-- CreateIndex
CREATE INDEX "ScanHistory_result_idx" ON "ScanHistory"("result");

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "Marketplace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerStore" ADD CONSTRAINT "SellerStore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerStore" ADD CONSTRAINT "SellerStore_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrefixRule" ADD CONSTRAINT "PrefixRule_expeditionId_fkey" FOREIGN KEY ("expeditionId") REFERENCES "Expedition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_expeditionId_fkey" FOREIGN KEY ("expeditionId") REFERENCES "Expedition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatchDetail" ADD CONSTRAINT "ImportBatchDetail_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatchDetail" ADD CONSTRAINT "ImportBatchDetail_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanHistory" ADD CONSTRAINT "ScanHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanHistory" ADD CONSTRAINT "ScanHistory_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanHistory" ADD CONSTRAINT "ScanHistory_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanHistory" ADD CONSTRAINT "ScanHistory_selectedExpeditionId_fkey" FOREIGN KEY ("selectedExpeditionId") REFERENCES "Expedition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanHistory" ADD CONSTRAINT "ScanHistory_detectedExpeditionId_fkey" FOREIGN KEY ("detectedExpeditionId") REFERENCES "Expedition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
