import { createGameCategory } from "~~/server/utils/game-categories"
import { auth } from "~~/auth"

export default defineEventHandler(async (event) => {
  // 檢查使用者是否已登入且為管理員
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session || !session.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "未授權",
    })
  }

  const body = await readBody(event)

  // 驗證必要欄位
  const requiredFields = ["gameId", "categoryName"]
  for (const field of requiredFields) {
    if (!body[field]) {
      throw createError({
        statusCode: 400,
        statusMessage: `缺少必要欄位: ${field}`,
      })
    }
  }

  try {
    const category = await createGameCategory({
      gameId: String(body.gameId),
      categoryName: body.categoryName,
      conditions: body.conditions,
    })

    return category
  } catch (error) {
    console.error("建立賽事分類失敗:", error)
    throw createError({
      statusCode: 500,
      statusMessage: "建立賽事分類失敗",
    })
  }
})
