import { z } from "zod"
import { auth } from "~~/auth"
import { createTeam, findTeamByName } from "~~/server/utils/teams"

/**
 * Create a new team
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
        statusMessage: "未登入",
      })
    }

    // 驗證輸入資料
    const schema = z.object({
      name: z.string().min(1, "隊伍名稱不能為空"),
    })

    const body = await readBody(event)
    const { name } = schema.parse(body)

    // 檢查隊伍名稱是否重複
    const existingTeam = await findTeamByName(name)

    if (existingTeam) {
      throw createError({
        statusCode: 400,
        statusMessage: "隊伍名稱已存在",
      })
    }

    // 創建隊伍
    const team = await createTeam({
      name,
      userId: session.user.id,
    })

    return team
  } catch (error) {
    console.error("Create team error:", error)
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: "創建隊伍失敗",
    })
  }
})
