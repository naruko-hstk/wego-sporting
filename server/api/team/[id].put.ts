import { z } from "zod"
import { auth } from "~~/auth"
import { prisma } from "~~/server/utils/prisma"

const updateTeamSchema = z.object({
  name: z.string().min(1, "隊伍名稱不能為空").max(50, "隊伍名稱不能超過50字"),
})

/**
 * Update a team
 * @description Updates team information
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

    const teamId = getRouterParam(event, "id")
    if (!teamId) {
      throw createError({
        statusCode: 400,
        statusMessage: "隊伍 ID 是必需的",
      })
    }

    // 解析並驗證請求資料
    const body = await readBody(event)
    const validatedData = updateTeamSchema.parse(body)

    // 檢查隊伍是否存在並驗證使用者權限
    const existingTeam = await prisma.team.findUnique({
      where: {
        id: teamId,
      },
      include: {
        user: {
          select: {
            id: true,
          },
        },
      },
    })

    if (!existingTeam) {
      throw createError({
        statusCode: 404,
        statusMessage: "隊伍不存在",
      })
    }

    // 檢查是否為隊伍創建者
    if (existingTeam.userId !== session.user.id) {
      throw createError({
        statusCode: 403,
        statusMessage: "沒有權限編輯此隊伍",
      })
    }

    // 檢查隊伍名稱是否已被其他隊伍使用
    const nameExists = await prisma.team.findFirst({
      where: {
        name: validatedData.name,
        id: { not: teamId },
      },
    })

    if (nameExists) {
      throw createError({
        statusCode: 400,
        statusMessage: "隊伍名稱已存在",
      })
    }

    // 更新隊伍
    const updatedTeam = await prisma.team.update({
      where: {
        id: teamId,
      },
      data: {
        name: validatedData.name,
        updatedAt: new Date(),
      },
    })

    return {
      success: true,
      data: updatedTeam,
    }
  } catch (error) {
    console.error("更新隊伍錯誤:", error)

    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: error.issues[0]?.message || "資料驗證失敗",
      })
    }

    throw error
  }
})
