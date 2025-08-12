import { auth } from "~~/auth"
import { getTeamStaff } from "~~/server/utils/team-staff"

/**
 * Get team staff list
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
    const teamId = query.teamId as string
    const role = query.role as string
    const limit = parseInt(query.limit as string) || 50
    const offset = parseInt(query.offset as string) || 0

    // 查找團隊職員
    const teamStaff = await getTeamStaff({
      teamId,
      role,
      userId: session.user.id, // 只能查看自己的隊伍職員
      limit,
      offset,
    })

    return teamStaff
  } catch (error: unknown) {
    console.error("Get team staff error:", error)
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : "獲取隊職員失敗",
    })
  }
})
