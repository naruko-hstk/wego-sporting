import { getGameFees } from "~~/server/utils/games"

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const gameId = query.gameId as string

  if (!gameId) {
    throw createError({
      statusCode: 400,
      statusMessage: "缺少 gameId 參數",
    })
  }

  try {
    const gameFees = await getGameFees(gameId as string)

    return gameFees
  } catch (error) {
    console.error("取得賽事費用失敗:", error)
    throw createError({
      statusCode: 500,
      statusMessage: "取得賽事費用失敗",
    })
  }
})
