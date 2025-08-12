import { prisma } from "./prisma"

/**
 * Get user players with filters
 * @param filters - Filter options
 * @returns Array of user players
 */
export const getUserPlayers = async (filters?: {
  userId?: string
  limit?: number
  offset?: number
}) => {
  const where: Record<string, unknown> = {}
  if (filters?.userId) where.userId = filters.userId

  return await prisma.user_player.findMany({
    where: {
      ...where,
      isBanned: false, // Only return non-banned players
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          registration_participant: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: filters?.limit || 50,
    skip: filters?.offset || 0,
  })
}

/**
 * Get user player by ID
 * @param id - User player ID
 * @param userId - Optional user ID for ownership check
 * @returns User player
 */
export const getUserPlayerById = async (id: string, userId?: string) => {
  const where: Record<string, unknown> = { id }
  if (userId) where.userId = userId

  const userPlayer = await prisma.user_player.findFirst({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      registration_participant: {
        include: {
          registration: {
            include: {
              game: true,
              game_category: true,
            },
          },
        },
      },
    },
  })

  if (!userPlayer) {
    throw new Error("User player not found or access denied")
  }

  return userPlayer
}

/**
 * Create user player
 * @param data - User player data
 * @returns Created user player
 */
export const createUserPlayer = async (data: {
  userId: string
  name: string
  gender: "M" | "F"
  birthday: string | Date
}) => {
  return await prisma.user_player.create({
    data: {
      ...data,
      birthday: new Date(data.birthday),
      updatedAt: new Date(),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })
}

/**
 * Update user player
 * @param id - User player ID
 * @param data - Updated data
 * @param userId - User ID for ownership check
 * @returns Updated user player
 */
export const updateUserPlayer = async (
  id: string,
  data: {
    name?: string
    gender?: "M" | "F"
    birthday?: string | Date
    isBanned?: boolean
    banReason?: string
    banUntil?: string | Date | null
  },
  userId?: string,
) => {
  // Check ownership if userId provided
  if (userId) {
    const existing = await getUserPlayerById(id, userId)
    if (!existing) {
      throw new Error("User player not found or access denied")
    }
  }

  const updateData: Record<string, unknown> = { ...data }
  if (data.birthday) {
    updateData.birthday = new Date(data.birthday)
  }
  if (data.banUntil) {
    updateData.banUntil = new Date(data.banUntil)
  }

  return await prisma.user_player.update({
    where: { id },
    data: updateData,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })
}

/**
 * Delete user player
 * @param id - User player ID
 * @param userId - User ID for ownership check
 * @returns Deleted user player
 */
export const deleteUserPlayer = async (id: string, userId?: string) => {
  // Check ownership if userId provided
  if (userId) {
    const existing = await getUserPlayerById(id, userId)
    if (!existing) {
      throw new Error("User player not found or access denied")
    }
  }

  return await prisma.user_player.delete({
    where: { id },
  })
}

/**
 * Ban user player
 * @param id - User player ID
 * @param banReason - Reason for ban
 * @param banUntil - Ban expiry date (optional)
 * @param userId - User ID for ownership check
 * @returns Updated user player
 */
export const banUserPlayer = async (
  id: string,
  banReason: string,
  banUntil?: string | Date,
  userId?: string,
) => {
  return await updateUserPlayer(
    id,
    {
      isBanned: true,
      banReason,
      banUntil: banUntil || null,
    },
    userId,
  )
}

/**
 * Unban user player
 * @param id - User player ID
 * @param userId - User ID for ownership check
 * @returns Updated user player
 */
export const unbanUserPlayer = async (id: string, userId?: string) => {
  return await updateUserPlayer(
    id,
    {
      isBanned: false,
      banReason: undefined,
      banUntil: null,
    },
    userId,
  )
}
