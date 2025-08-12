import { auth } from "~~/auth"
import { getTeams } from "~~/server/utils/teams"

/**
 * Get user's teams
 */
export default defineEventHandler(async (event) => {
  try {
    // 獲取使用者 session
    const headers = new Headers()
    const eventHeaders = getHeaders(event)
    Object.entries(eventHeaders).forEach(([key, value]) => {
      if (value) headers.set(key, value)
    })

    const session = await auth.api.getSession({ headers })
    if (!session?.user) {
      return []
    }

    // 查找使用者創建的隊伍
    const teams = await getTeams({
      userId: session.user.id,
    })

    return teams
  } catch (error) {
    console.error("Get teams error:", error)
    throw createError({
      statusCode: 500,
      statusMessage: "獲取隊伍失敗",
    })
  }
})
