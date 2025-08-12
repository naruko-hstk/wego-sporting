import { auth } from "~~/auth"
import { getUserPlayers } from "~~/server/utils/user-players"

/**
 * Get user players list
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
      throw createError({
        statusCode: 401,
        statusMessage: "請先登入",
      })
    }

    // 獲取查詢參數
    const query = getQuery(event)
    const limit = parseInt(query.limit as string) || 50
    const offset = parseInt(query.offset as string) || 0

    // 查找使用者的隊員
    const userPlayers = await getUserPlayers({
      userId: session.user.id, // 只能查看自己的隊員
      limit,
      offset,
    })

    return userPlayers
  } catch (error: unknown) {
    console.error("Get user players error:", error)
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : "獲取隊員失敗",
    })
  }
})
