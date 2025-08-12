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

    // 獲取查詢參數
    const query = getQuery(event)
    const limit = Number(query.limit) || 10
    const offset = Number(query.offset) || 0
    const searchValue = query.searchValue as string
    const searchField = (query.searchField as string) || "name"
    const sortBy = (query.sortBy as string) || "createdAt"
    const sortDirection = (query.sortDirection as string) || "asc"

    // 構建 where 條件
    const where: Record<string, unknown> = {}
    if (searchValue && searchField) {
      where[searchField] = {
        contains: searchValue,
        mode: "insensitive",
      }
    }

    // 構建 orderBy 條件
    const orderBy: Record<string, "asc" | "desc"> = {
      [sortBy]: sortDirection as "asc" | "desc",
    }

    // 獲取用戶列表和總數
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          banned: true,
          createdAt: true,
          username: true,
        },
      }),
      prisma.user.count({ where }),
    ])

    return {
      users,
      total,
      limit,
      offset,
    }
  } catch (error: unknown) {
    console.error("Admin users API error:", error)

    if (error && typeof error === "object" && "statusCode" in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    })
  }
})
