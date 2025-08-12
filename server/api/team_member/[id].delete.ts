import { auth } from "~~/auth"
import { prisma } from "~~/server/utils/prisma"

/**
 * Delete a team member
 * @description Removes a team member from the database
 */
export default defineEventHandler(async (event) => {
  try {
    // 驗證使用者登入狀態
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

    const memberId = getRouterParam(event, "id")
    if (!memberId) {
      throw createError({
        statusCode: 400,
        statusMessage: "成員 ID 是必需的",
      })
    }

    // 檢查成員是否存在且使用者有權限
    const existingMember = await prisma.team_member.findFirst({
      where: {
        id: memberId,
      },
      include: {
        team: {
          select: {
            userId: true,
          },
        },
      },
    })

    if (!existingMember) {
      throw createError({
        statusCode: 404,
        statusMessage: "成員不存在",
      })
    }

    if (existingMember.team.userId !== session.user.id) {
      throw createError({
        statusCode: 403,
        statusMessage: "沒有權限刪除此成員",
      })
    }

    // 刪除成員
    await prisma.team_member.delete({
      where: {
        id: memberId,
      },
    })

    return {
      success: true,
      message: "成員已成功刪除",
    }
  } catch (error) {
    console.error("刪除成員錯誤:", error)

    if (error && typeof error === "object" && "statusCode" in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: "刪除成員失敗",
    })
  }
})
