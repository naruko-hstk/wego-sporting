import { prisma } from "~~/server/utils/prisma"

/**
 * Get game categories for a specific game
 * @param gameId - Game ID to get categories for
 * @returns Array of game categories
 */
export const getGameCategories = async (gameId?: string) => {
  if (gameId) {
    return await prisma.game_category.findMany({
      where: { gameId },
      include: {
        game_fee: true,
        registration: {
          include: {
            user: true,
            team: {
              include: {
                team_member: true,
              },
            },
          },
        },
        _count: {
          select: {
            registration: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    })
  }

  return await prisma.game_category.findMany({
    include: {
      game: true,
      game_fee: true,
      _count: {
        select: {
          registration: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })
}

/**
 * Create a new game category
 * @param data - Category data
 * @returns Created category
 */
export const createGameCategory = async (data: {
  gameId: string
  categoryName: string
  conditions?: string
}) => {
  return await prisma.game_category.create({
    data,
    include: {
      game: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })
}

/**
 * Update a game category
 * @param id - Category ID
 * @param data - Updated data
 * @returns Updated category
 */
export const updateGameCategory = async (
  id: string,
  data: {
    categoryName?: string
    conditions?: string
  },
) => {
  return await prisma.game_category.update({
    where: { id },
    data,
    include: {
      game: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })
}

/**
 * Delete a game category
 * @param id - Category ID
 * @returns Deleted category
 */
export const deleteGameCategory = async (id: string) => {
  return await prisma.game_category.delete({
    where: { id },
  })
}
