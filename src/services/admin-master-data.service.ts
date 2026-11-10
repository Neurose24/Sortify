import { Prisma } from "../../generated/prisma/client";
import {
  createMasterData,
  countStoresForSeller,
  findExpeditionMasterData,
  findMarketplaceMasterData,
  findMasterDataById,
  findMasterDataOptions,
  findPrefixRuleMasterData,
  findSellerById,
  findStoreMasterData,
  findUserMasterData,
  updateMasterData,
} from "@/models/AdminMasterDataModel";
import {
  createUserInputSchema,
  expeditionInputSchema,
  marketplaceInputSchema,
  prefixRuleInputSchema,
  storeInputSchema,
  type MasterDataResource,
  updateUserInputSchema,
} from "@/validators/master-data.validator";
import { hashPassword } from "@/services/password.service";

export class MasterDataNotFoundError extends Error {
  constructor() {
    super("Data yang diminta tidak ditemukan.");
    this.name = "MasterDataNotFoundError";
  }
}

export class MasterDataConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MasterDataConflictError";
  }
}

export class MasterDataValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MasterDataValidationError";
  }
}

function assertResource(value: string): asserts value is MasterDataResource {
  if (
    value !== "marketplaces" &&
    value !== "stores" &&
    value !== "expeditions" &&
    value !== "prefix-rules" &&
    value !== "users"
  ) {
    throw new MasterDataValidationError("Jenis master data tidak dikenal.");
  }
}

export async function getMasterDataPageData(resource: MasterDataResource) {
  const rows = await (async () => {
    switch (resource) {
      case "marketplaces": {
        const records = await findMarketplaceMasterData();
        return records.map((item) => ({
          id: item.id,
          title: item.nama,
          subtitle: item.stores.map((store) => store.nama).join(", ") || "Belum terhubung ke toko",
          fields: { nama: item.nama },
          counts: { "Jumlah toko": item._count.stores },
          createdAt: item.createdAt.toISOString(),
        }));
      }
      case "stores": {
        const records = await findStoreMasterData();
        return records.map((item) => ({
          id: item.id,
          title: item.nama,
          subtitle: `${item.marketplace.nama} · ${item.seller.nama} (@${item.seller.username})`,
          fields: {
            nama: item.nama,
            marketplaceId: item.marketplaceId,
            sellerId: item.sellerId,
          },
          counts: { Paket: item._count.packages },
          createdAt: item.createdAt.toISOString(),
        }));
      }
      case "expeditions": {
        const records = await findExpeditionMasterData();
        return records.map((item) => ({
          id: item.id,
          title: item.nama,
          subtitle: "Ekspedisi terdaftar",
          fields: { nama: item.nama },
          counts: {
            "Aturan prefix": item._count.prefixRules,
            Paket: item._count.packages,
          },
          createdAt: item.createdAt.toISOString(),
        }));
      }
      case "prefix-rules": {
        const records = await findPrefixRuleMasterData();
        return records.map((item) => ({
          id: item.id,
          title: item.expedition.nama,
          subtitle: [
            item.awalan ? `Awalan: ${item.awalan}` : null,
            item.akhiran ? `Akhiran: ${item.akhiran}` : null,
            item.panjang ? `Panjang: ${item.panjang}` : null,
          ]
            .filter(Boolean)
            .join(" · "),
          fields: {
            expeditionId: item.expeditionId,
            awalan: item.awalan ?? "",
            akhiran: item.akhiran ?? "",
            panjang: item.panjang?.toString() ?? "",
          },
          counts: { Ekspedisi: 1 },
          createdAt: item.createdAt.toISOString(),
        }));
      }
      case "users": {
        const records = await findUserMasterData();
        return records.map((item) => ({
          id: item.id,
          title: item.nama,
          subtitle: `@${item.username}`,
          fields: {
            nama: item.nama,
            username: item.username,
            role: item.role,
          },
          counts: {
            Toko: item._count.managedStores,
            Paket: item._count.packages,
            Scan: item._count.scanHistories,
          },
          createdAt: item.createdAt.toISOString(),
        }));
      }
    }
  })();
  const [marketplaces, sellers, expeditions] = await findMasterDataOptions();

  return {
    rows,
    options: {
      marketplaces: marketplaces.map((item) => ({ id: item.id, label: item.nama })),
      sellers: sellers.map((item) => ({
        id: item.id,
        label: `${item.nama} (@${item.username})`,
      })),
      expeditions: expeditions.map((item) => ({ id: item.id, label: item.nama })),
    },
  };
}

function parseInput(resource: MasterDataResource, input: unknown, update: boolean) {
  switch (resource) {
    case "marketplaces":
      return marketplaceInputSchema.parse(input);
    case "stores":
      return storeInputSchema.parse(input);
    case "expeditions":
      return expeditionInputSchema.parse(input);
    case "prefix-rules":
      return prefixRuleInputSchema.parse(input);
    case "users":
      return update ? updateUserInputSchema.parse(input) : createUserInputSchema.parse(input);
  }
}

function toModelData(resource: MasterDataResource, values: Record<string, unknown>) {
  if (resource === "prefix-rules") {
    return {
      ...values,
      panjang: values.panjang === "" ? null : values.panjang,
    };
  }
  return values;
}

export async function saveMasterData({
  resource: resourceValue,
  id,
  input,
  currentUserId,
}: {
  resource: string;
  id?: string;
  input: unknown;
  currentUserId: string;
}) {
  assertResource(resourceValue);
  const resource = resourceValue;
  const parsed = parseInput(resource, input, Boolean(id));
  const values = parsed as Record<string, unknown>;

  if (resource === "users") {
    if (id && id === currentUserId && values.role !== "ADMIN") {
      throw new MasterDataConflictError(
        "Anda tidak dapat mengubah role akun Admin yang sedang digunakan.",
      );
    }
    if (id && values.role !== "SELLER") {
      const storeCount = await countStoresForSeller(id);
      if (storeCount > 0) {
        throw new MasterDataConflictError(
          "Pindahkan toko ke Seller lain terlebih dahulu sebelum mengubah role akun ini.",
        );
      }
    }
    if (!id || values.password) {
      values.password = await hashPassword(values.password as string);
    } else {
      delete values.password;
    }
  }

  try {
    if (resource === "stores") {
      const seller = await findSellerById(values.sellerId as string);
      if (!seller) {
        throw new MasterDataValidationError(
          "Toko harus ditugaskan kepada akun dengan role Seller.",
        );
      }
    }

    if (id) {
      const existing = await findMasterDataById(resource, id);
      if (!existing) throw new MasterDataNotFoundError();
      await updateMasterData(resource, id, toModelData(resource, values));
    } else {
      await createMasterData(resource, toModelData(resource, values));
    }
  } catch (error) {
    if (error instanceof MasterDataNotFoundError) throw error;
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const conflictField = Array.isArray(error.meta?.target)
          ? error.meta.target.join(",")
          : typeof error.meta?.target === "string"
            ? error.meta.target
            : "";
        const message = conflictField.includes("username")
          ? "Username sudah digunakan."
          : conflictField.includes("marketplaceId") ||
              (resource === "stores" && conflictField.includes("nama"))
            ? "Nama toko sudah digunakan pada marketplace tersebut."
            : "Data dengan nilai yang sama sudah ada.";
        throw new MasterDataConflictError(message);
      }
      if (error.code === "P2025") throw new MasterDataNotFoundError();
      if (error.code === "P2003") {
        throw new MasterDataValidationError(
          "Relasi yang dipilih tidak lagi tersedia. Muat ulang halaman dan coba kembali.",
        );
      }
    }
    throw error;
  }
}

export function parseMasterDataResource(value: string) {
  assertResource(value);
  return value;
}
