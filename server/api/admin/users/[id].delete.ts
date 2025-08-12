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

    // 不允許刪除 owner
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, name: true, email: true },
    })

    if (!existingUser) {
      throw createError({
        statusCode: 404,
        statusMessage: "User not found",
      })
    }

    if (existingUser.role === "owner") {
      throw createError({
        statusCode: 403,
        statusMessage: "Cannot delete owner",
      })
    }

    // 刪除用戶（Prisma 會自動處理相關的 cascade 刪除）
    const deletedUser = await prisma.user.delete({
      where: { id: userId },
    })

    return {
      success: true,
      deletedUser: {
        id: deletedUser.id,
        name: deletedUser.name,
        email: deletedUser.email,
      },
    }
  } catch (error: unknown) {
    console.error("Delete user API error:", error)

    if (error && typeof error === "object" && "statusCode" in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    })
  }
})
