import api, { getApiErrorMessage } from "../config/api";
import { readJsonStorage, userScopedKey, writeJsonStorage } from "../lib/storage";

type WishlistResponse = {
  productIds?: string[];
  wishlist?: { productId?: string; product?: { id?: string } }[];
};

const readRemoteIds = (data: WishlistResponse) => {
  if (data.productIds) return data.productIds;
  return (
    data.wishlist
      ?.map((item) => item.productId ?? item.product?.id)
      .filter((id): id is string => Boolean(id)) ?? []
  );
};

const localKey = (userId?: string | null) => userScopedKey("wishlist", userId);

const readLocal = (userId?: string | null) => readJsonStorage<string[]>(localKey(userId), []);
const writeLocal = (userId: string | null | undefined, productIds: string[]) => {
  writeJsonStorage(localKey(userId), [...new Set(productIds)]);
};

export const wishlistService = {
  async getWishlist(userId?: string | null) {
    try {
      const { data } = await api.get<WishlistResponse>("/wishlist");
      const productIds = readRemoteIds(data);
      writeLocal(userId, productIds);
      return productIds;
    } catch {
      return readLocal(userId);
    }
  },

  async addProduct(userId: string | null | undefined, productId: string) {
    const next = [...new Set([...readLocal(userId), productId])];
    writeLocal(userId, next);

    try {
      await api.post("/wishlist", { productId });
    } catch (error) {
      if (!getApiErrorMessage(error).includes("404")) {
        return next;
      }
    }

    return next;
  },

  async removeProduct(userId: string | null | undefined, productId: string) {
    const next = readLocal(userId).filter((id) => id !== productId);
    writeLocal(userId, next);

    try {
      await api.delete(`/wishlist/${productId}`);
    } catch {
      return next;
    }

    return next;
  },
};
