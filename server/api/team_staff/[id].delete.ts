import { auth } from "~~/auth"
import { deleteTeamStaff } from "~~/server/utils/team-staff"

/**
 * Delete team staff
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
        statusMessage: "缺少隊職員 ID",
      })
    }

    // 刪除隊職員
    await deleteTeamStaff(id, session.user.id)

    return { success: true }
  } catch (error: unknown) {
    console.error("Delete team staff error:", error)
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : "刪除隊職員失敗",
    })
  }
})
