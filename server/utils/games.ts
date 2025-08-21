import { prisma } from "./prisma"

/**
 * Get game(s) from database
 * @param id - Optional game ID. If provided, returns single game with all related data. If not provided, returns all games without relations.
 * @returns Single game with relations or array of games without relations
 */
export const getGame = async (id?: string, region?: string) => {
  if (id) {
    return await prisma.game.findUnique({
      where: { id },
      include: {
        game_detail: true,
        game_category: {
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
                registration_participant: {
                  include: {
                    team_member: true,
                  },
                },
              },
            },
          },
        },
        game_fee: true,
        registration: {
          include: {
            user: true,
            team: {
              include: {
                team_member: true,
              },
            },
            registration_participant: {
              include: {
                team_member: true,
              },
            },
          },
        },
      },
    })
  }
  if (region) {
    return await prisma.game.findMany({
      where: {
        region: region,
      },
      include: {
        game_category: true,
        game_fee: true,
        _count: {
          select: {
            registration: true,
            game_category: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })
  } else {
    return await prisma.game.findMany({
      include: {
        game_category: true,
        game_fee: true,
        _count: {
          select: {
            registration: true,
            game_category: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })
  }
}

/**
 * Create a new game with related data
 * @param data - Game data including categories and fees
 * @returns Created game
 */
export const createGame = async (data: {
  name: string
  region: string
  venue: string
  address: string
  signupStart: Date
  signupEnd: Date
  gameStart: Date
  gameEnd: Date
  basis?: string
  note?: string
  categories?: Array<{
    categoryType: string
    categoryName: string
    conditions?: string
  }>
  fees?: Array<{
    feeType: string
    description?: string
    amount: number
    categoryType?: string
    categoryName?: string
    categoryId?: string
  }>
}) => {
  return await prisma.$transaction(async (tx) => {
    // Create game
    const game = await tx.game.create({
      data: {
        name: data.name,
        region: data.region,
        venue: data.venue,
        address: data.address,
        signupStart: data.signupStart,
        signupEnd: data.signupEnd,
        gameStart: data.gameStart,
        gameEnd: data.gameEnd,
        updatedAt: new Date(),
      },
    })

    // Create game detail if provided
    if (data.basis || data.note) {
      await tx.game_detail.create({
        data: {
          gameId: game.id,
          basis: data.basis || null,
          note: data.note || null,
          updatedAt: new Date(),
        },
      })
    }

    // Create categories if provided (批次)
    if (
      data.categories &&
      Array.isArray(data.categories) &&
      data.categories.length > 0
    ) {
      await tx.game_category.createMany({
        data: data.categories.map((category) => ({
          gameId: game.id,
          categoryType: category.categoryType,
          categoryName: category.categoryName,
          conditions: category.conditions,
          updatedAt: new Date(),
          createdAt: new Date(),
        })),
      })
    }

    // Create fees if provided (批次)
    if (data.fees && Array.isArray(data.fees) && data.fees.length > 0) {
      // 先查出所有 category
      const allCategories = await tx.game_category.findMany({
        where: { gameId: game.id },
      })
      await tx.game_fee.createMany({
        data: data.fees.map((fee) => {
          let categoryId = null
          if (fee.categoryType && fee.categoryName) {
            const cat = allCategories.find(
              (c) =>
                c.categoryType === fee.categoryType &&
                c.categoryName === fee.categoryName,
            )
            if (cat) categoryId = cat.id
          }
          return {
            gameId: game.id,
            categoryId,
            feeType: fee.feeType,
            description: fee.description || "",
            amount: fee.amount,
            updatedAt: new Date(),
            createdAt: new Date(),
          }
        }),
      })
    }

    return game
  })
}

/**
 * Update a game
 * @param id - Game ID
 * @param data - Updated game data
 * @returns Updated game
 */
export const updateGame = async (
  id: string,
  data: {
    name?: string
    region?: string
    venue?: string
    address?: string
    signupStart?: Date
    signupEnd?: Date
    gameStart?: Date
    gameEnd?: Date
  },
) => {
  return await prisma.game.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  })
}

/**
 * Delete a game
 * @param id - Game ID
 * @returns Deleted game
 */
export const deleteGame = async (id: string) => {
  return await prisma.game.delete({
    where: { id },
  })
}

/**
 * Get game detail
 * @param gameId - Game ID
 * @returns Game detail
 */
export const getGameDetail = async (gameId: string) => {
  return await prisma.game_detail.findUnique({
    where: { gameId },
  })
}

/**
 * Create or update game detail
 * @param gameId - Game ID
 * @param data - Game detail data
 * @returns Game detail
 */
export const upsertGameDetail = async (
  gameId: string,
  data: {
    basis?: string
    note?: string
  },
) => {
  return await prisma.game_detail.upsert({
    where: { gameId },
    create: {
      gameId,
      basis: data.basis || null,
      note: data.note || null,
      updatedAt: new Date(),
    },
    update: {
      basis: data.basis || null,
      note: data.note || null,
      updatedAt: new Date(),
    },
  })
}

/**
 * Get game fees
 * @param gameId - Game ID
 * @param categoryId - Optional category ID
 * @returns Array of game fees
 */
export const getGameFees = async (gameId?: string, categoryId?: string) => {
  const where: Record<string, unknown> = {}
  if (gameId) where.gameId = gameId
  if (categoryId) where.categoryId = categoryId

  return await prisma.game_fee.findMany({
    where,
    include: {
      game: true,
      game_category: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  })
}

/**
 * Create a game fee
 * @param data - Game fee data
 * @returns Created game fee
 */
export const createGameFee = async (data: {
  gameId: string
  categoryId?: string
  feeType: string
  description: string
  amount: number
  isRequired?: boolean
  note?: string
}) => {
  return await prisma.game_fee.create({
    data: {
      ...data,
      isRequired: data.isRequired ?? true,
      updatedAt: new Date(),
    },
  })
}

/**
 * Update a game fee
 * @param id - Game fee ID
 * @param data - Updated game fee data
 * @returns Updated game fee
 */
export const updateGameFee = async (
  id: string,
  data: {
    feeType?: string
    description?: string
    amount?: number
    isRequired?: boolean
    note?: string
  },
) => {
  return await prisma.game_fee.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  })
}

/**
 * Delete a game fee
 * @param id - Game fee ID
 * @returns Deleted game fee
 */
export const deleteGameFee = async (id: string) => {
  return await prisma.game_fee.delete({
    where: { id },
  })
}
