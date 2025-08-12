import { auth } from "~~/auth"
import { prisma } from "~~/server/utils/prisma"

/**
 * Delete a team
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
        statusMessage: "未登入",
      })
    }

    const teamId = getRouterParam(event, "id")
    if (!teamId) {
      throw createError({
        statusCode: 400,
        statusMessage: "缺少隊伍 ID",
      })
    }

    // 檢查隊伍是否存在且使用者有權限
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        userId: session.user.id,
      },
    })

    if (!team) {
      throw createError({
        statusCode: 404,
        statusMessage: "隊伍不存在或無權限",
      })
    }

    // 刪除隊伍（會級聯刪除成員）
    await prisma.team.delete({
      where: { id: teamId },
    })

    return { success: true }
  } catch (error) {
    console.error("Delete team error:", error)
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: "刪除隊伍失敗",
    })
  }
})
