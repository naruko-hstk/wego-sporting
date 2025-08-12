import { getGameRegistrations } from "~~/server/utils/registrations"

/**
 * Get all registrations for a specific game (for admin review)
 */
export default defineEventHandler(async (event) => {
  try {
    const gameId = getRouterParam(event, "id")
    console.log("Fetching registrations for gameId:", gameId)

    if (!gameId) {
      throw createError({
        statusCode: 400,
        statusMessage: "賽事 ID 為必填項目",
      })
    }

    // 暫時跳過權限檢查進行調試
    // const headers = new Headers()
    // const eventHeaders = getHeaders(event)
    // Object.entries(eventHeaders).forEach(([key, value]) => {
    //   if (value) headers.set(key, value)
    // })

    // const session = await auth.api.getSession({ headers })
    // console.log("Session user:", session?.user?.id)

    // if (!session?.user) {
    //   throw createError({
    //     statusCode: 401,
    //     statusMessage: "未授權",
    //   })
    // }

    // TODO: 檢查使用者是否有管理權限

    // 使用 utils 函數獲取報名記錄
    const registrations = await getGameRegistrations(gameId)

    console.log("Found registrations:", registrations.length)
    return registrations
  } catch (error) {
    console.error("Get registrations error:", error)
    throw createError({
      statusCode: 500,
      statusMessage: "獲取報名記錄失敗",
    })
  }
})
