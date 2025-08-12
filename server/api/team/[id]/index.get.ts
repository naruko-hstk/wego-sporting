import { auth } from "~~/auth"
import { prisma } from "~~/server/utils/prisma"

/**
 * Get a specific team by ID
 * @description Retrieves detailed information about a team including members and statistics
 */
export default defineEventHandler(async (event) => {
  try {
    const teamId = getRouterParam(event, "id")
    console.log("Get team API called with ID:", teamId)

    if (!teamId) {
      throw createError({
        statusCode: 400,
        statusMessage: "隊伍 ID 是必需的",
      })
    }

    // 驗證使用者登入狀態
    const headers = new Headers()
    const eventHeaders = getHeaders(event)
    Object.entries(eventHeaders).forEach(([key, value]) => {
      if (value) headers.set(key, value)
    })

    const session = await auth.api.getSession({ headers })
    console.log("Session user:", session?.user?.id)

    if (!session?.user) {
      throw createError({
        statusCode: 401,
        statusMessage: "請先登入",
      })
    }

    // 查找隊伍（只能查看自己的隊伍）
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        team_member: {
          orderBy: {
            name: "asc",
          },
        },
        registration: true,
        _count: {
          select: {
            team_member: true,
            registration: true,
          },
        },
      },
    })

    if (!team) {
      throw createError({
        statusCode: 404,
        statusMessage: "隊伍不存在或無權限查看",
      })
    }

    return team
  } catch (error) {
    console.error("Get team error:", error)

    if (error && typeof error === "object" && "statusCode" in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: "獲取隊伍資料失敗",
    })
  }
})
