import { deleteGameCategory } from "~~/server/utils/game-categories"
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

  const categoryId = getRouterParam(event, "id")
  if (!categoryId) {
    throw createError({
      statusCode: 400,
      statusMessage: "缺少分類 ID",
    })
  }

  try {
    await deleteGameCategory(categoryId)
    return { success: true, message: "分類已成功刪除" }
  } catch (error) {
    console.error("刪除賽事分類失敗:", error)
    throw createError({
      statusCode: 500,
      statusMessage: "刪除賽事分類失敗",
    })
  }
})
