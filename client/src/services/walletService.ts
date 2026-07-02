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

export const walletService = {
  async getWallet(): Promise<WalletResponse> {
    const { data } = await api.get<WalletResponse>("/wallet");
    return {
      balance: Number(data.balance ?? 0),
      transactions: data.transactions ?? [],
    };
  },

  async recharge(amount: number, reference?: string): Promise<WalletResponse> {
    const { data } = await api.post<WalletResponse>("/wallet/recharge", {
      amount,
      reference,
    });
    return {
      balance: Number(data.balance ?? 0),
      transactions: data.transactions ?? [],
    };
  },
};
