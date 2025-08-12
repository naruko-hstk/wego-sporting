import { auth } from "~~/auth"
import { deleteUserPlayer } from "~~/server/utils/user-players"

/**
 * Delete user player
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

    // 獲取 ID
    const id = getRouterParam(event, "id")
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "缺少隊員 ID",
      })
    }

    // 刪除隊員
    await deleteUserPlayer(id, session.user.id)

    return { success: true }
  } catch (error: unknown) {
    console.error("Delete user player error:", error)
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : "刪除隊員失敗",
    })
  }
})
