import { getGame } from "~~/server/utils/games"

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { region, id } = query

  try {
    const games = await getGame(id as string, region as string)
    return games
  } catch (error) {
    console.error("獲取賽事清單失敗:", error)
    throw createError({
      statusCode: 500,
      statusMessage: "獲取賽事清單失敗",
    })
  }
})
