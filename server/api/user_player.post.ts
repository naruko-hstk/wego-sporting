import { auth } from "~~/auth"
import { createUserPlayer } from "~~/server/utils/user-players"

/**
 * Create user player
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

    // 解析請求資料
    const body = await readBody(event)
    const { name, gender, birthday } = body

    // 驗證必要欄位
    if (!name || !gender || !birthday) {
      throw createError({
        statusCode: 400,
        statusMessage: "姓名、性別和生日為必填欄位",
      })
    }

    // 驗證性別
    if (!["M", "F"].includes(gender)) {
      throw createError({
        statusCode: 400,
        statusMessage: "性別必須是 M（男）或 F（女）",
      })
    }

    // 驗證生日
    const birthdayDate = new Date(birthday)
    if (isNaN(birthdayDate.getTime())) {
      throw createError({
        statusCode: 400,
        statusMessage: "生日格式不正確",
      })
    }

    // 建立隊員
    const userPlayer = await createUserPlayer({
      userId: session.user.id,
      name,
      gender,
      birthday: birthdayDate,
    })

    return userPlayer
  } catch (error: unknown) {
    console.error("Create user player error:", error)
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : "建立隊員失敗",
    })
  }
})
