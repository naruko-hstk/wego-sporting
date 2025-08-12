import { z } from "zod"
import { auth } from "~~/auth"
import { prisma } from "~~/server/utils/prisma"

const createMemberSchema = z.object({
  teamId: z.string().min(1, "隊伍 ID 是必需的"),
  name: z.string().min(1, "姓名不能為空").max(50, "姓名不能超過50字"),
  role: z.string().min(1, "角色不能為空"),
  gender: z.enum(["M", "F"], { message: "性別必須是 M 或 F" }),
  birthday: z.string().min(1, "生日不能為空"),
  phone: z.string().optional(),
  email: z.string().email("請輸入有效的電子郵件").optional(),
})

/**
 * Create a new team member
 * @description Creates a new team member with validation
 */
export default defineEventHandler(async (event) => {
  try {
    // 驗證使用者登入狀態
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

    // 解析並驗證請求資料
    const body = await readBody(event)
    const validatedData = createMemberSchema.parse(body)

    // 驗證隊伍是否存在且使用者有權限
    const team = await prisma.team.findFirst({
      where: {
        id: validatedData.teamId,
        userId: session.user.id,
      },
    })

    if (!team) {
      throw createError({
        statusCode: 403,
        statusMessage: "沒有權限操作此隊伍",
      })
    }

    // 生成成員 ID
    const memberId = crypto.randomUUID()

    // 創建成員
    const member = await prisma.team_member.create({
      data: {
        id: memberId,
        teamId: validatedData.teamId,
        name: validatedData.name,
        role: validatedData.role,
        gender: validatedData.gender,
        birthday: new Date(validatedData.birthday),
        phone: validatedData.phone || null,
        email: validatedData.email || null,
        updatedAt: new Date(),
      },
    })

    return {
      success: true,
      data: member,
    }
  } catch (error) {
    console.error("創建成員錯誤:", error)

    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: error.issues[0]?.message || "資料驗證失敗",
      })
    }

    if (error && typeof error === "object" && "statusCode" in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: "創建成員失敗",
    })
  }
})
