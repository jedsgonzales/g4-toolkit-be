import { PrismaClient } from '@internal/prisma/smartg4';

export const createExtendedPrisma = (prisma: PrismaClient) => {
  const extendedPrisma = prisma;

  // add extension declarations here

  return extendedPrisma;
};

export const prismaService = createExtendedPrisma(new PrismaClient());
export type SmartG4DbClient = ReturnType<typeof createExtendedPrisma>;
