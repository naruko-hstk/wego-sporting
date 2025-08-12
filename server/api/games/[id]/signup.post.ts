import { auth } from "~~/auth"
import { prisma } from "~~/server/utils/prisma"

/**
 * Handle game registration
 */
export default defineEventHandler(async (event) => {
  try {
    const gameId = getRouterParam(event, "id")
    const body = await readBody(event)

    // 驗證輸入
    const { categoryId, teamId, participants, note } = body
    // participants 現在應該是 { userPlayerId: string, isMainPlayer: boolean }[] 或 { name: string, gender: string, age: number, isMainPlayer: boolean }[]

    if (!gameId || !categoryId || !participants?.length) {
      throw createError({
        statusCode: 400,
        message: "請填寫所有必填欄位",
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
        message: "請先登入",
      })
    }

    // 檢查比賽是否存在
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        game_category: {
          where: { id: categoryId },
        },
      },
    })

    if (!game) {
      throw createError({
        statusCode: 404,
        message: "找不到此比賽",
      })
    }

    if (!game.game_category.length) {
      throw createError({
        statusCode: 404,
        message: "找不到此比賽類別",
      })
    }

    // 檢查報名時間
    const now = new Date()
    if (now < game.signupStart) {
      throw createError({
        statusCode: 400,
        message: "報名尚未開始",
      })
    }

    if (now > game.signupEnd) {
      throw createError({
        statusCode: 400,
        message: "報名已截止",
      })
    }

    // 檢查是否已報名此類別（如果有 teamId）
    if (teamId) {
      const existingRegistration = await prisma.registration.findFirst({
        where: {
          gameId,
          categoryId,
          teamId,
        },
      })

      if (existingRegistration) {
        throw createError({
          statusCode: 400,
          message: "此隊伍已經報名此類別",
        })
      }
    }

    // 驗證參賽者資料
    const validParticipants = []

    for (const participant of participants) {
      if (participant.userPlayerId) {
        // 使用者隊員模式：驗證 user_player 是否存在且屬於當前使用者
        const userPlayer = await prisma.user_player.findFirst({
          where: {
            id: participant.userPlayerId,
            userId: session.user.id,
            isBanned: false,
          },
        })

        if (!userPlayer) {
          throw createError({
            statusCode: 400,
            message: "部分隊員不存在或已被禁賽",
          })
        }

        validParticipants.push({
          userPlayerId: participant.userPlayerId,
          isMainPlayer: participant.isMainPlayer || false,
        })
      } else if (participant.name && participant.gender && participant.age) {
        // 手動輸入模式：建立臨時隊員記錄（如果需要的話）
        validParticipants.push({
          manualData: {
            name: participant.name,
            gender: participant.gender,
            age: participant.age,
          },
          isMainPlayer: participant.isMainPlayer || false,
        })
      } else {
        throw createError({
          statusCode: 400,
          message: "參賽者資料不完整",
        })
      }
    }

    // 建立報名記錄
    const registration = await prisma.registration.create({
      data: {
        id: crypto.randomUUID(),
        gameId,
        categoryId,
        teamId: teamId || null, // teamId 現在可能為空（個人報名）
        registrantUserId: session.user.id,
        status: "pending",
        note: note || null,
        registration_participant: {
          create: validParticipants.map((participant) => {
            if (participant.userPlayerId) {
              return {
                id: crypto.randomUUID(),
                userPlayerId: participant.userPlayerId,
                isMainPlayer: participant.isMainPlayer,
              }
            } else {
              // 手動輸入的參賽者，需要先建立臨時的 user_player 記錄
              // 或者在 registration_participant 中儲存手動資料
              throw new Error("手動輸入參賽者暫不支援，請先新增隊員到個人帳號")
            }
          }),
        },
      },
      include: {
        game: true,
        game_category: true,
        team: true,
        registration_participant: {
          include: {
            user_player: true,
          },
        },
      },
    })

    return {
      success: true,
      data: registration,
    }
  } catch (error) {
    console.error("Game signup error:", error)
    throw error
  }
})
