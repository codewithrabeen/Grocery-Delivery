import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { asyncHandler, routeParam } from "../utils/api.js";

const listUserAddresses = (userId: string) =>
  prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

export const getAddresses = asyncHandler(async (req: Request, res: Response) => {
  const addresses = await listUserAddresses(req.user!.id);
  return res.json({ success: true, addresses });
});

export const addAddresses = asyncHandler(async (req: Request, res: Response) => {
  const { label, address, city, state, zip, isDefault, lat, lng } = req.body;
  const userId = req.user!.id;
  const currentAddresses = await listUserAddresses(userId);
  const makeDefault = currentAddresses.length === 0 || Boolean(isDefault);

  if (makeDefault) {
    await prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  const createdAddress = await prisma.address.create({
    data: {
      userId,
      label,
      address,
      city,
      state,
      zip,
      isDefault: makeDefault,
      lat: Number(lat),
      lng: Number(lng),
    },
  });

  const addresses = await listUserAddresses(userId);

  return res.status(201).json({
    success: true,
    message: "Address added successfully",
    data: createdAddress,
    address: createdAddress,
    addresses,
  });
});

export const updateAddresses = asyncHandler(async (req: Request, res: Response) => {
  const { label, address, city, state, zip, isDefault, lat, lng } = req.body;
  const userId = req.user!.id;
  const addressId = routeParam(req.params.id);

  const existingAddress = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });

  if (!existingAddress) {
    return res.status(404).json({ message: "Address not found" });
  }

  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  const updatedAddress = await prisma.address.update({
    where: { id: existingAddress.id },
    data: {
      label,
      address,
      city,
      state,
      zip,
      isDefault: Boolean(isDefault),
      lat: Number(lat),
      lng: Number(lng),
    },
  });

  const addresses = await listUserAddresses(userId);

  return res.json({
    success: true,
    message: "Address updated successfully",
    data: updatedAddress,
    address: updatedAddress,
    addresses,
  });
});

export const deleteAddresses = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const addressId = routeParam(req.params.id);
  const existingAddress = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });

  if (!existingAddress) {
    return res.status(404).json({ message: "Address not found" });
  }

  await prisma.address.delete({ where: { id: existingAddress.id } });

  const addresses = await listUserAddresses(userId);

  if (existingAddress.isDefault && addresses[0]) {
    await prisma.address.update({
      where: { id: addresses[0].id },
      data: { isDefault: true },
    });
  }

  const refreshedAddresses = await listUserAddresses(userId);

  return res.json({
    success: true,
    message: "Address deleted successfully",
    addresses: refreshedAddresses,
  });
});
