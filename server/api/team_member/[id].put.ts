import { z } from "zod"
import { auth } from "~~/auth"
import { prisma } from "~~/server/utils/prisma"

const updateMemberSchema = z.object({
  name: z.string().min(1, "姓名不能為空").max(50, "姓名不能超過50字"),
  role: z.string().min(1, "角色不能為空"),
  gender: z.enum(["M", "F"], { message: "性別必須是 M 或 F" }),
  birthday: z.string().min(1, "生日不能為空"),
  phone: z.string().optional(),
  email: z.string().email("請輸入有效的電子郵件").optional(),
})

/**
 * Update a team member
 * @description Updates team member information with validation
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

    const memberId = getRouterParam(event, "id")
    if (!memberId) {
      throw createError({
        statusCode: 400,
        statusMessage: "成員 ID 是必需的",
      })
    }

    // 解析並驗證請求資料
    const body = await readBody(event)
    const validatedData = updateMemberSchema.parse(body)

    // 檢查成員是否存在且使用者有權限
    const existingMember = await prisma.team_member.findFirst({
      where: {
        id: memberId,
      },
      include: {
        team: {
          select: {
            userId: true,
          },
        },
      },
    })

    if (!existingMember) {
      throw createError({
        statusCode: 404,
        statusMessage: "成員不存在",
      })
    }

    if (existingMember.team.userId !== session.user.id) {
      throw createError({
        statusCode: 403,
        statusMessage: "沒有權限編輯此成員",
      })
    }

    // 更新成員
    const updatedMember = await prisma.team_member.update({
      where: {
        id: memberId,
      },
      data: {
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
      data: updatedMember,
    }
  } catch (error) {
    console.error("更新成員錯誤:", error)

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
      statusMessage: "更新成員失敗",
    })
  }
})
