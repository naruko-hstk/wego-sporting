import { auth } from "~~/auth"
import { prisma } from "~~/server/utils/prisma"

export default defineEventHandler(async (event) => {
  try {
    // 檢查 session
    const session = await auth.api.getSession({
      headers: event.headers,
    })

    if (!session?.user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized - No session",
      })
    }

    // 檢查用戶角色
    if (!["admin", "owner"].includes(session.user.role || "")) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden - Insufficient permissions",
      })
    }

    // 獲取用戶 ID
    const userId = getRouterParam(event, "id")
    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: "User ID is required",
      })
    }

    // 獲取請求 body
    const body = await readBody(event)
    const { role } = body

    if (!role || !["user", "admin"].includes(role)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid role. Must be 'user' or 'admin'",
      })
    }

    // 不允許將 owner 角色修改
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (existingUser?.role === "owner") {
      throw createError({
        statusCode: 403,
        statusMessage: "Cannot modify owner role",
      })
    }

    // 更新用戶角色
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
    })

    return {
      success: true,
      user: {
        id: updatedUser.id,
        role: updatedUser.role,
      },
    }
  } catch (error: unknown) {
    console.error("Set user role API error:", error)

    if (error && typeof error === "object" && "statusCode" in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    })
  }
})
