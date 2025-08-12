import { auth } from "~~/auth"
import { updateUserPlayer } from "~~/server/utils/user-players"

/**
 * Update user player
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

    // 解析請求資料
    const body = await readBody(event)
    const { name, gender, birthday, isBanned, banReason, banUntil } = body

    // 驗證性別（如果有提供）
    if (gender && !["M", "F"].includes(gender)) {
      throw createError({
        statusCode: 400,
        statusMessage: "性別必須是 M（男）或 F（女）",
      })
    }

    // 驗證生日（如果有提供）
    let birthdayDate
    if (birthday) {
      birthdayDate = new Date(birthday)
      if (isNaN(birthdayDate.getTime())) {
        throw createError({
          statusCode: 400,
          statusMessage: "生日格式不正確",
        })
      }
    }

    // 更新隊員
    const userPlayer = await updateUserPlayer(
      id,
      {
        name,
        gender,
        birthday: birthdayDate,
        isBanned,
        banReason,
        banUntil,
      },
      session.user.id,
    )

    return userPlayer
  } catch (error: unknown) {
    console.error("Update user player error:", error)
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : "更新隊員失敗",
    })
  }
})
