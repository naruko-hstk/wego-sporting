import { auth } from "~~/auth"
import { prisma } from "~~/server/utils/prisma"

/**
 * Update an existing registration (for rejected registrations)
 */
export default defineEventHandler(async (event) => {
  try {
    const registrationId = getRouterParam(event, "id")
    const body = await readBody(event)

    // 驗證輸入
    const { participants, note } = body

    if (!registrationId || !participants?.length) {
      throw createError({
        statusCode: 400,
        statusMessage: "請填寫所有必填欄位",
      })
    }

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

    // 檢查報名是否存在且屬於當前用戶
    const existingRegistration = await prisma.registration.findFirst({
      where: {
        id: registrationId,
        registrantUserId: session.user.id,
      },
      include: {
        team: true,
        game: true,
        registration_participant: true,
      },
    })

    if (!existingRegistration) {
      throw createError({
        statusCode: 404,
        statusMessage: "找不到此報名記錄",
      })
    }

    // 只允許修改被拒絕或待審核的報名
    if (existingRegistration.status === "confirmed") {
      throw createError({
        statusCode: 400,
        statusMessage: "已確認的報名無法修改",
      })
    }

    // 檢查報名時間是否仍在有效期內
    const now = new Date()
    if (now > existingRegistration.game.signupEnd) {
      throw createError({
        statusCode: 400,
        statusMessage: "報名時間已截止",
      })
    }

    // 驗證隊伍成員是否屬於該隊伍
    const teamMembers = await prisma.team_member.findMany({
      where: {
        id: { in: participants },
        teamId: existingRegistration.teamId,
      },
    })

    if (teamMembers.length !== participants.length) {
      throw createError({
        statusCode: 400,
        statusMessage: "部分隊伍成員不存在或不屬於此隊伍",
      })
    }

    // 使用交易更新報名
    const updatedRegistration = await prisma.$transaction(async (tx) => {
      // 1. 刪除現有的參賽者記錄
      await tx.registration_participant.deleteMany({
        where: { registrationId },
      })

      // 2. 更新報名狀態為待審核（如果原本是拒絕）
      const registration = await tx.registration.update({
        where: { id: registrationId },
        data: {
          note: note || null,
          status:
            existingRegistration.status === "rejected"
              ? "pending"
              : existingRegistration.status,
          submittedAt: new Date(), // 更新提交時間
          reviewedAt: null, // 清空審核時間
          reviewedBy: null, // 清空審核者
        },
        include: {
          game_category: true,
          team: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      // 3. 新增新的參賽者記錄
      await tx.registration_participant.createMany({
        data: participants.map((memberId: string) => ({
          registrationId,
          teamMemberId: memberId,
          isMainPlayer: false, // 可以根據需要調整
        })),
      })

      return registration
    })

    return {
      success: true,
      message: "報名更新成功",
      registration: updatedRegistration,
    }
  } catch (error: unknown) {
    // Log the error for debugging
    console.error("Error updating registration:", error)

    // Handle known errors
    if (
      error &&
      typeof error === "object" &&
      "statusCode" in error &&
      "message" in error
    ) {
      const httpError = error as { statusCode: number; message: string }
      throw createError({
        statusCode: httpError.statusCode,
        statusMessage: httpError.message || "更新報名失敗",
      })
    }

    // Handle unknown errors
    throw createError({
      statusCode: 500,
      statusMessage: "伺服器內部錯誤",
    })
  }
})
