import {
  findPackagesForAdmin,
  findPackagesForSeller,
} from "@/models/PackageModel";

export function listPackagesForAdmin() {
  return findPackagesForAdmin();
}

export function listPackagesForSeller(sellerId: string) {
  return findPackagesForSeller(sellerId);
}