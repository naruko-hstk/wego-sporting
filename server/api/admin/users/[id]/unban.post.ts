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

    // 更新用戶狀態
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        banned: null,
        banReason: null,
        banExpires: null,
      },
    })

    return {
      success: true,
      user: {
        id: updatedUser.id,
        banned: updatedUser.banned,
        banReason: updatedUser.banReason,
        banExpires: updatedUser.banExpires,
      },
    }
  } catch (error: unknown) {
    console.error("Unban user API error:", error)

    if (error && typeof error === "object" && "statusCode" in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    })
  }
})
