import api from "../config/api";
import type { Address } from "../types";

export type AddressInput = Omit<Address, "id" | "createdAt" | "updatedAt">;

type AddressResponse = {
  addresses?: Address[];
  address?: Address;
};

const KATHMANDU_CENTER = {
  lat: 27.7172,
  lng: 85.324,
};

export const createAddressPayload = (
  address: Partial<AddressInput> & Pick<AddressInput, "label" | "address" | "city" | "state" | "zip">,
): AddressInput => ({
  label: address.label,
  address: address.address,
  city: address.city,
  state: address.state,
  zip: address.zip,
  isDefault: Boolean(address.isDefault),
  lat: Number(address.lat ?? KATHMANDU_CENTER.lat),
  lng: Number(address.lng ?? KATHMANDU_CENTER.lng),
});

const readAddresses = (data: AddressResponse) => data.addresses ?? (data.address ? [data.address] : []);

export const addressService = {
  async getAddresses() {
    const { data } = await api.get<AddressResponse>("/addresses");
    return readAddresses(data);
  },

  async addAddress(address: AddressInput) {
    const { data } = await api.post<AddressResponse>("/addresses", address);
    return readAddresses(data);
  },

  async updateAddress(id: string, address: AddressInput) {
    const { data } = await api.put<AddressResponse>(`/addresses/${id}`, address);
    return readAddresses(data);
  },

  async deleteAddress(id: string) {
    const { data } = await api.delete<AddressResponse>(`/addresses/${id}`);
    return readAddresses(data);
  },
};
