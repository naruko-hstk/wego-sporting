import { getGame, deleteGame } from "~~/server/utils/games"
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

  // 檢查使用者是否為管理員
  if (!["admin", "owner"].includes(session.user.role || "")) {
    throw createError({
      statusCode: 403,
      statusMessage: "權限不足",
    })
  }

  const gameId = getRouterParam(event, "id")
  if (!gameId) {
    throw createError({
      statusCode: 400,
      statusMessage: "缺少賽事 ID",
    })
  }

  try {
    // 檢查賽事是否存在
    const existingGame = await getGame(gameId)

    if (!existingGame) {
      throw createError({
        statusCode: 404,
        statusMessage: "賽事不存在",
      })
    }

    // 檢查是否有報名資料 - getGame會包含registration資訊
    if (Array.isArray(existingGame)) {
      throw createError({
        statusCode: 500,
        statusMessage: "獲取賽事資料格式錯誤",
      })
    }

    if (existingGame.registration && existingGame.registration.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "已有隊伍報名，無法刪除賽事",
      })
    }

    // 刪除賽事（Cascade 會自動刪除相關資料）
    await deleteGame(gameId)

    return { success: true, message: "賽事已成功刪除" }
  } catch (error) {
    console.error("刪除賽事失敗:", error)

    // If it's already a structured error, throw it
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: "刪除賽事失敗",
    })
  }
})
