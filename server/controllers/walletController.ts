import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/api.js";

export const getWallet = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { walletBalance: true },
  });
  const transactions = await prisma.walletTransaction.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return res.json({
    success: true,
    balance: user?.walletBalance ?? 0,
    transactions,
  });
});

export const rechargeWallet = asyncHandler(async (req: Request, res: Response) => {
  const { amount, reference } = req.body;

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: req.user!.id },
      data: { walletBalance: { increment: amount } },
    });

    const transaction = await tx.walletTransaction.create({
      data: {
        userId: req.user!.id,
        type: "RECHARGE",
        amount,
        balanceAfter: user.walletBalance,
        reference,
        description: "Wallet recharge",
      },
    });

    return { user, transaction };
  });

  return res.status(201).json({
    success: true,
    message: "Wallet recharged",
    balance: result.user.walletBalance,
    transaction: result.transaction,
  });
});
