import { findAllStores, findStoresForSeller } from "@/models/StoreModel";

export function listAllStores() {
  return findAllStores();
}

export function listStoresForSeller(sellerId: string) {
  return findStoresForSeller(sellerId);
}
