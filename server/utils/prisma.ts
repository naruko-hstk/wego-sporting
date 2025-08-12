import { PrismaClient } from "@prisma/client"
import { withAccelerate } from "@prisma/extension-accelerate"

const createPrismaClient = () =>
  new PrismaClient().$extends(withAccelerate()) as unknown as PrismaClient

export const prisma =
  process.env.NODE_ENV === "production"
    ? createPrismaClient()
    : ((globalThis as unknown as { prisma?: PrismaClient }).prisma ??=
        createPrismaClient())
