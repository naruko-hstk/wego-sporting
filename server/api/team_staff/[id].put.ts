import { auth } from "~~/auth"
import { updateTeamStaff } from "~~/server/utils/team-staff"

/**
 * Update team staff
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
        statusMessage: "缺少隊職員 ID",
      })
    }

    // 解析請求資料
    const body = await readBody(event)
    const { role, name, phone, email, address, lineId } = body

    // 驗證角色（如果有提供）
    if (role && !["leader", "coach"].includes(role)) {
      throw createError({
        statusCode: 400,
        statusMessage: "職位必須是 leader（領隊）或 coach（教練）",
      })
    }

    // 更新隊職員
    const teamStaff = await updateTeamStaff(
      id,
      {
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
    console.error("Update team staff error:", error)
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : "更新隊職員失敗",
    })
  }
})
