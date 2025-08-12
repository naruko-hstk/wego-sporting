import { auth } from "~~/auth"
import { createTeamStaff } from "~~/server/utils/team-staff"

/**
 * Create team staff
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
    const { teamId, role, name, phone, email, address, lineId } = body

    // 驗證必要欄位
    if (!teamId || !role || !name) {
      throw createError({
        statusCode: 400,
        statusMessage: "隊伍ID、職位和姓名為必填欄位",
      })
    }

    // 驗證角色
    if (!["leader", "coach"].includes(role)) {
      throw createError({
        statusCode: 400,
        statusMessage: "職位必須是 leader（領隊）或 coach（教練）",
      })
    }

    // 建立隊職員
    const teamStaff = await createTeamStaff(
      {
        teamId,
        role,
        name,
        phone,
        email,
        address,
        lineId,
      },
      session.user.id,
    )

    return teamStaff
  } catch (error: unknown) {
    console.error("Create team staff error:", error)
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : "建立隊職員失敗",
    })
  }
})
