import type { Prisma } from "../../generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { MasterDataResource } from "@/validators/master-data.validator";

export function findMarketplaceMasterData() {
  return prisma.marketplace.findMany({
    select: {
      id: true,
      nama: true,
      createdAt: true,
      _count: { select: { stores: true } },
      stores: {
        select: { id: true, nama: true },
        orderBy: { nama: "asc" },
      },
    },
    orderBy: { nama: "asc" },
  });
}

export function findStoreMasterData() {
  return prisma.store.findMany({
    select: {
      id: true,
      nama: true,
      marketplaceId: true,
      sellerId: true,
      createdAt: true,
      marketplace: { select: { nama: true } },
      seller: { select: { nama: true, username: true } },
      _count: { select: { packages: true } },
    },
    orderBy: [{ nama: "asc" }, { id: "asc" }],
  });
}

export function findExpeditionMasterData() {
  return prisma.expedition.findMany({
    select: {
      id: true,
      nama: true,
      createdAt: true,
      _count: { select: { prefixRules: true, packages: true } },
    },
    orderBy: { nama: "asc" },
  });
}

export function findPrefixRuleMasterData() {
  return prisma.prefixRule.findMany({
    select: {
      id: true,
      expeditionId: true,
      awalan: true,
      akhiran: true,
      panjang: true,
      createdAt: true,
      expedition: { select: { nama: true } },
    },
    orderBy: [{ expedition: { nama: "asc" } }, { createdAt: "asc" }],
  });
}

export function findUserMasterData() {
  return prisma.user.findMany({
    select: {
      id: true,
      nama: true,
      username: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          managedStores: true,
          packages: true,
          scanHistories: true,
        },
      },
    },
    orderBy: [{ role: "asc" }, { nama: "asc" }],
  });
}

export function findMasterDataOptions() {
  return Promise.all([
    prisma.marketplace.findMany({
      select: { id: true, nama: true },
      orderBy: { nama: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "SELLER" },
      select: { id: true, nama: true, username: true },
      orderBy: { nama: "asc" },
    }),
    prisma.expedition.findMany({
      select: { id: true, nama: true },
      orderBy: { nama: "asc" },
    }),
  ]);
}

export function findSellerById(id: string) {
  return prisma.user.findFirst({
    where: { id, role: "SELLER" },
    select: { id: true },
  });
}

export function countStoresForSeller(id: string) {
  return prisma.store.count({ where: { sellerId: id } });
}

export async function createMasterData(
  resource: MasterDataResource,
  data: Record<string, unknown>,
) {
  switch (resource) {
    case "marketplaces":
      return prisma.marketplace.create({
        data: data as Prisma.MarketplaceCreateInput,
        select: { id: true },
      });
    case "stores":
      return prisma.store.create({
        data: {
          nama: data.nama as string,
          marketplace: { connect: { id: data.marketplaceId as string } },
          seller: { connect: { id: data.sellerId as string } },
        },
        select: { id: true },
      });
    case "expeditions":
      return prisma.expedition.create({
        data: data as Prisma.ExpeditionCreateInput,
        select: { id: true },
      });
    case "prefix-rules":
      return prisma.prefixRule.create({
        data: {
          expedition: { connect: { id: data.expeditionId as string } },
          awalan: (data.awalan as string) || null,
          akhiran: (data.akhiran as string) || null,
          panjang: (data.panjang as number) || null,
        },
        select: { id: true },
      });
    case "users":
      return prisma.user.create({
        data: data as Prisma.UserCreateInput,
        select: { id: true },
      });
  }
}

export async function updateMasterData(
  resource: MasterDataResource,
  id: string,
  data: Record<string, unknown>,
) {
  switch (resource) {
    case "marketplaces":
      return prisma.marketplace.update({
        where: { id },
        data: data as Prisma.MarketplaceUpdateInput,
        select: { id: true },
      });
    case "stores":
      return prisma.store.update({
        where: { id },
        data: {
          nama: data.nama as string,
          marketplace: { connect: { id: data.marketplaceId as string } },
          seller: { connect: { id: data.sellerId as string } },
        },
        select: { id: true },
      });
    case "expeditions":
      return prisma.expedition.update({
        where: { id },
        data: data as Prisma.ExpeditionUpdateInput,
        select: { id: true },
      });
    case "prefix-rules":
      return prisma.prefixRule.update({
        where: { id },
        data: {
          expedition: { connect: { id: data.expeditionId as string } },
          awalan: (data.awalan as string) || null,
          akhiran: (data.akhiran as string) || null,
          panjang: (data.panjang as number) || null,
        },
        select: { id: true },
      });
    case "users":
      if (data.password) {
        return prisma.$transaction(async (transaction) => {
          const user = await transaction.user.update({
            where: { id },
            data: data as Prisma.UserUpdateInput,
            select: { id: true },
          });
          await transaction.session.deleteMany({ where: { userId: id } });
          return user;
        });
      }
      return prisma.user.update({
        where: { id },
        data: data as Prisma.UserUpdateInput,
        select: { id: true },
      });
  }
}

export async function findMasterDataById(resource: MasterDataResource, id: string) {
  switch (resource) {
    case "marketplaces":
      return prisma.marketplace.findUnique({ where: { id }, select: { id: true } });
    case "stores":
      return prisma.store.findUnique({ where: { id }, select: { id: true } });
    case "expeditions":
      return prisma.expedition.findUnique({ where: { id }, select: { id: true } });
    case "prefix-rules":
      return prisma.prefixRule.findUnique({ where: { id }, select: { id: true } });
    case "users":
      return prisma.user.findUnique({ where: { id }, select: { id: true } });
  }
}
