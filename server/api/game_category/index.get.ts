import { getGameCategories } from "~~/server/utils/game-categories"

/**
 * Get game categories for a specific game
 */
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const gameId = query.gameId as string | undefined

    const categories = await getGameCategories(gameId)
    return categories
  } catch (error) {
    console.error("獲取賽事分類失敗:", error)
    throw createError({
      statusCode: 500,
      statusMessage: "獲取賽事分類失敗",
    })
  }
})
