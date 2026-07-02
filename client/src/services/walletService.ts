import api from "../config/api";

export type WalletTransaction = {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  reference?: string;
  description?: string;
  createdAt: string;
};

export type WalletResponse = {
  balance: number;
  transactions: WalletTransaction[];
};

type WalletApiResponse = {
  balance?: number;
  transactions?: WalletTransaction[];
  transaction?: WalletTransaction;
};

const normalizeWallet = (data: WalletApiResponse): WalletResponse => ({
  balance: Number(data.balance ?? 0),
  transactions: data.transactions ?? (data.transaction ? [data.transaction] : []),
});

export const walletService = {
  async getWallet(): Promise<WalletResponse> {
    const { data } = await api.get<WalletApiResponse>("/wallet");
    return normalizeWallet(data);
  },

  async recharge(amount: number, reference?: string): Promise<WalletResponse> {
    const { data } = await api.post<WalletApiResponse>("/wallet/recharge", {
      amount,
      reference,
    });
    return normalizeWallet(data);
  },
};
