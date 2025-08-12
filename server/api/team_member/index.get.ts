import { auth } from "~~/auth"
import { getTeamMembers } from "~~/server/utils/teams"

/**
 * Get team members by team ID
 */
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const teamId = query.teamId as string

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

    // 如果沒有指定 teamId，返回空陣列
    if (!teamId) {
      return []
    }

    // 查找隊伍成員
    const teamMembers = await getTeamMembers({
      teamId: teamId as string,
      userId: session.user.id, // 只能查看自己的隊伍成員
    })

    return teamMembers
  } catch (error) {
    console.error("Get team members error:", error)
    throw createError({
      statusCode: 500,
      statusMessage: "內部伺服器錯誤",
    })
  }
})
