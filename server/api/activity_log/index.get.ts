import {
  getActivityLogs,
  getActivityLogsCount,
} from "~~/server/utils/activity-logs"
import { auth } from "~~/auth"

/**
 * Get activity logs (admin only)
 */
export default defineEventHandler(async (event) => {
  try {
    // Check authentication and authorization
    const session = await auth.api.getSession({ headers: event.headers })
    if (
      !session?.user ||
      !["admin", "owner"].includes(session.user.role || "")
    ) {
      throw createError({
        statusCode: 403,
        statusMessage: "權限不足",
      })
    }

    const query = getQuery(event)
    const {
      action,
      entity,
      userId,
      limit = "50",
      offset = "0",
      startDate,
      endDate,
    } = query

    const filters = {
      action: action as string,
      entity: entity as string,
      userId: userId as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    }

    const [logs, total] = await Promise.all([
      getActivityLogs(filters),
      getActivityLogsCount(filters),
    ])

    return {
      data: logs,
      total,
      limit: filters.limit,
      offset: filters.offset,
    }
  } catch (error) {
    console.error("獲取活動記錄失敗:", error)

    // If it's already a structured error, throw it
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: "獲取活動記錄失敗",
    })
  }
})
