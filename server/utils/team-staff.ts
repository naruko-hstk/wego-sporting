import { prisma } from "./prisma"

/**
 * Get team staff with filters
 * @param filters - Filter options
 * @returns Array of team staff
 */
export const getTeamStaff = async (filters?: {
  teamId?: string
  userId?: string
  role?: string
  limit?: number
  offset?: number
}) => {
  const where: Record<string, unknown> = {}

  if (filters?.teamId) where.teamId = filters.teamId
  if (filters?.role) where.role = filters.role

  // If userId is provided, filter by teams owned by this user
  const teamWhere: Record<string, unknown> = {}
  if (filters?.userId) teamWhere.userId = filters.userId

  return await prisma.team_staff.findMany({
    where: {
      ...where,
      ...(filters?.userId ? { team: teamWhere } : {}),
    },
    include: {
      team: {
        select: {
          id: true,
          name: true,
          userId: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: filters?.limit || 50,
    skip: filters?.offset || 0,
  })
}

/**
 * Get team staff by ID
 * @param id - Team staff ID
 * @param userId - Optional user ID for ownership check
 * @returns Team staff
 */
export const getTeamStaffById = async (id: string, userId?: string) => {
  const teamStaff = await prisma.team_staff.findFirst({
    where: {
      id,
      ...(userId ? { team: { userId } } : {}),
    },
    include: {
      team: {
        select: {
          id: true,
          name: true,
          userId: true,
        },
      },
    },
  })

  if (!teamStaff) {
    throw new Error("Team staff not found or access denied")
  }

  return teamStaff
}

/**
 * Create team staff
 * @param data - Team staff data
 * @param userId - User ID for ownership check
 * @returns Created team staff
 */
export const createTeamStaff = async (
  data: {
    teamId: string
    role: string
    name: string
    phone?: string
    email?: string
    address?: string
    lineId?: string
  },
  userId?: string,
) => {
  // Check team ownership if userId provided
  if (userId) {
    const team = await prisma.team.findFirst({
      where: { id: data.teamId, userId },
    })
    if (!team) {
      throw new Error("Team not found or access denied")
    }
  }

  return await prisma.team_staff.create({
    data,
    include: {
      team: {
        select: {
          id: true,
          name: true,
          userId: true,
        },
      },
    },
  })
}

/**
 * Update team staff
 * @param id - Team staff ID
 * @param data - Updated data
 * @param userId - User ID for ownership check
 * @returns Updated team staff
 */
export const updateTeamStaff = async (
  id: string,
  data: {
    role?: string
    name?: string
    phone?: string
    email?: string
    address?: string
    lineId?: string
  },
  userId?: string,
) => {
  // Check ownership if userId provided
  if (userId) {
    const existing = await getTeamStaffById(id, userId)
    if (!existing) {
      throw new Error("Team staff not found or access denied")
    }
  }

  return await prisma.team_staff.update({
    where: { id },
    data,
    include: {
      team: {
        select: {
          id: true,
          name: true,
          userId: true,
        },
      },
    },
  })
}

/**
 * Delete team staff
 * @param id - Team staff ID
 * @param userId - User ID for ownership check
 * @returns Deleted team staff
 */
export const deleteTeamStaff = async (id: string, userId?: string) => {
  // Check ownership if userId provided
  if (userId) {
    const existing = await getTeamStaffById(id, userId)
    if (!existing) {
      throw new Error("Team staff not found or access denied")
    }
  }

  return await prisma.team_staff.delete({
    where: { id },
  })
}
