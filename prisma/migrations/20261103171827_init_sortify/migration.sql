-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'PETUGAS', 'SELLER');

-- CreateEnum
CREATE TYPE "PackageScanStatus" AS ENUM ('BELUM_DISCAN', 'SUDAH_DISCAN');

-- CreateEnum
CREATE TYPE "PackageCondition" AS ENUM ('NORMAL', 'PENDING', 'BATAL', 'DUPLIKAT', 'PREFIX_TIDAK_DIKENAL');

-- CreateEnum
CREATE TYPE "SecurityStatus" AS ENUM ('TIDAK_PERLU', 'PERLU_DIAMANKAN', 'SUDAH_DIAMANKAN');

-- CreateEnum
CREATE TYPE "ScanResult" AS ENUM ('BERHASIL', 'BARCODE_TIDAK_DIKENAL', 'PREFIX_TIDAK_DIKENAL', 'SUDAH_PERNAH_DISCAN', 'PAKET_PENDING', 'PAKET_BATAL', 'PAKET_DUPLIKAT', 'GAGAL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplaces" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stores" (
    "id" TEXT NOT NULL,
    "marketplaceId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expeditions" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expeditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prefix_rules" (
    "id" TEXT NOT NULL,
    "expeditionId" TEXT NOT NULL,
    "awalan" TEXT,
    "akhiran" TEXT,
    "panjang" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prefix_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packages" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "expeditionId" TEXT,
    "createdById" TEXT,
    "nomorPesanan" TEXT NOT NULL,
    "barcode" TEXT,
    "statusScan" "PackageScanStatus" NOT NULL DEFAULT 'BELUM_DISCAN',
    "statusPaket" "PackageCondition" NOT NULL DEFAULT 'NORMAL',
    "statusPengamanan" "SecurityStatus" NOT NULL DEFAULT 'TIDAK_PERLU',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scan_histories" (
    "id" TEXT NOT NULL,
    "packageId" TEXT,
    "userId" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "hasilScan" "ScanResult" NOT NULL,
    "statusPaket" "PackageCondition",
    "statusPengamanan" "SecurityStatus",
    "keterangan" TEXT,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scan_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "marketplaces_nama_key" ON "marketplaces"("nama");

-- CreateIndex
CREATE INDEX "stores_sellerId_idx" ON "stores"("sellerId");

-- CreateIndex
CREATE UNIQUE INDEX "stores_marketplaceId_nama_key" ON "stores"("marketplaceId", "nama");

-- CreateIndex
CREATE UNIQUE INDEX "expeditions_nama_key" ON "expeditions"("nama");

-- CreateIndex
CREATE INDEX "prefix_rules_expeditionId_idx" ON "prefix_rules"("expeditionId");

-- CreateIndex
CREATE UNIQUE INDEX "packages_barcode_key" ON "packages"("barcode");

-- CreateIndex
CREATE INDEX "packages_expeditionId_idx" ON "packages"("expeditionId");

-- CreateIndex
CREATE INDEX "packages_statusScan_idx" ON "packages"("statusScan");

-- CreateIndex
CREATE INDEX "packages_statusPaket_idx" ON "packages"("statusPaket");

-- CreateIndex
CREATE INDEX "packages_statusPengamanan_idx" ON "packages"("statusPengamanan");

-- CreateIndex
CREATE UNIQUE INDEX "packages_storeId_nomorPesanan_key" ON "packages"("storeId", "nomorPesanan");

-- CreateIndex
CREATE INDEX "scan_histories_packageId_idx" ON "scan_histories"("packageId");

-- CreateIndex
CREATE INDEX "scan_histories_userId_idx" ON "scan_histories"("userId");

-- CreateIndex
CREATE INDEX "scan_histories_barcode_idx" ON "scan_histories"("barcode");

-- CreateIndex
CREATE INDEX "scan_histories_scannedAt_idx" ON "scan_histories"("scannedAt");

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prefix_rules" ADD CONSTRAINT "prefix_rules_expeditionId_fkey" FOREIGN KEY ("expeditionId") REFERENCES "expeditions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_expeditionId_fkey" FOREIGN KEY ("expeditionId") REFERENCES "expeditions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_histories" ADD CONSTRAINT "scan_histories_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_histories" ADD CONSTRAINT "scan_histories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
