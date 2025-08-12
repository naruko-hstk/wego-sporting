import { prisma } from "./prisma"

/**
 * Create a new activity log entry
 * @param data - Activity log data
 * @returns Created activity log
 */
export const createActivityLog = async (data: {
  action: string
  entity: string
  entityId?: string
  userId?: string
  description: string
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}) => {
  return await prisma.activity_log.create({
    data: {
      ...data,
      metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
    },
  })
}

/**
 * Get activity logs with filters
 * @param filters - Filter options
 * @returns Array of activity logs
 */
export const getActivityLogs = async (filters?: {
  action?: string
  entity?: string
  userId?: string
  limit?: number
  offset?: number
  startDate?: Date
  endDate?: Date
}) => {
  const where: Record<string, unknown> = {}

  if (filters?.action) where.action = filters.action
  if (filters?.entity) where.entity = filters.entity
  if (filters?.userId) where.userId = filters.userId

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {} as Record<string, Date>
    if (filters.startDate) {
      ;(where.createdAt as Record<string, Date>).gte = filters.startDate
    }
    if (filters.endDate) {
      ;(where.createdAt as Record<string, Date>).lte = filters.endDate
    }
  }

  return await prisma.activity_log.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    take: filters?.limit || 50,
    skip: filters?.offset || 0,
  })
}

/**
 * Get activity logs count with filters
 * @param filters - Filter options
 * @returns Count of activity logs
 */
export const getActivityLogsCount = async (filters?: {
  action?: string
  entity?: string
  userId?: string
  startDate?: Date
  endDate?: Date
}) => {
  const where: Record<string, unknown> = {}

  if (filters?.action) where.action = filters.action
  if (filters?.entity) where.entity = filters.entity
  if (filters?.userId) where.userId = filters.userId

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {} as Record<string, Date>
    if (filters.startDate) {
      ;(where.createdAt as Record<string, Date>).gte = filters.startDate
    }
    if (filters.endDate) {
      ;(where.createdAt as Record<string, Date>).lte = filters.endDate
    }
  }

  return await prisma.activity_log.count({ where })
}
