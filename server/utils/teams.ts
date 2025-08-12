import { prisma } from "./prisma"

/**
 * Get teams with filters
 * @param filters - Filter options
 * @returns Array of teams
 */
export const getTeams = async (filters?: {
  userId?: string
  limit?: number
  offset?: number
}) => {
  const where: Record<string, unknown> = {}
  if (filters?.userId) where.userId = filters.userId

  return await prisma.team.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      team_staff: {
        orderBy: {
          createdAt: "asc",
        },
      },
      team_member: {
        where: {
          isBanned: false,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      _count: {
        select: {
          team_staff: true,
          team_member: true,
          registration: true,
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
 * Get team by ID
 * @param id - Team ID
 * @param userId - Optional user ID for ownership check
 * @returns Team with members
 */
export const getTeamById = async (id: string, userId?: string) => {
  const where: Record<string, unknown> = { id }
  if (userId) where.userId = userId

  return await prisma.team.findFirst({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      team_staff: {
        orderBy: {
          createdAt: "asc",
        },
      },
      team_member: {
        orderBy: {
          createdAt: "asc",
        },
      },
      registration: {
        include: {
          game: true,
          game_category: true,
        },
      },
    },
  })
}

/**
 * Create a new team
 * @param data - Team data
 * @returns Created team
 */
export const createTeam = async (data: { name: string; userId: string }) => {
  return await prisma.team.create({
    data: {
      name: data.name,
      userId: data.userId,
      updatedAt: new Date(),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      team_member: true,
    },
  })
}

/**
 * Update a team
 * @param id - Team ID
 * @param data - Updated team data
 * @param userId - User ID for ownership check
 * @returns Updated team
 */
export const updateTeam = async (
  id: string,
  data: {
    name?: string
  },
  userId?: string,
) => {
  if (userId) {
    // Check ownership first
    const existingTeam = await prisma.team.findFirst({
      where: { id, userId },
    })
    if (!existingTeam) {
      throw new Error("Team not found or access denied")
    }
  }

  return await prisma.team.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      team_member: true,
    },
  })
}

/**
 * Delete a team
 * @param id - Team ID
 * @param userId - User ID for ownership check
 * @returns Deleted team
 */
export const deleteTeam = async (id: string, userId?: string) => {
  if (userId) {
    // Check ownership first
    const existingTeam = await prisma.team.findFirst({
      where: { id, userId },
    })
    if (!existingTeam) {
      throw new Error("Team not found or access denied")
    }
  }

  return await prisma.team.delete({
    where: { id },
  })
}

/**
 * Check if team name exists
 * @param name - Team name
 * @param excludeId - Team ID to exclude from check
 * @returns Team if exists
 */
export const findTeamByName = async (name: string, excludeId?: string) => {
  const where: Record<string, unknown> = { name }
  if (excludeId) {
    where.id = { not: excludeId }
  }

  return await prisma.team.findFirst({
    where,
  })
}

/**
 * Get team members with filters
 * @param filters - Filter options
 * @returns Array of team members
 */
export const getTeamMembers = async (filters?: {
  teamId?: string
  userId?: string
  isBanned?: boolean
  limit?: number
  offset?: number
}) => {
  const where: Record<string, unknown> = {}
  if (filters?.teamId) where.teamId = filters.teamId
  if (filters?.isBanned !== undefined) where.isBanned = filters.isBanned

  // Add user check for team ownership if userId provided
  if (filters?.userId && filters?.teamId) {
    const team = await prisma.team.findFirst({
      where: {
        id: filters.teamId,
        userId: filters.userId,
      },
    })
    if (!team) {
      throw new Error("Team not found or access denied")
    }
  }

  return await prisma.team_member.findMany({
    where,
    include: {
      team: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    take: filters?.limit || 50,
    skip: filters?.offset || 0,
  })
}

/**
 * Get team member by ID
 * @param id - Team member ID
 * @param userId - Optional user ID for ownership check
 * @returns Team member
 */
export const getTeamMemberById = async (id: string, userId?: string) => {
  const teamMember = await prisma.team_member.findFirst({
    where: { id },
    include: {
      team: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  })

  // Check ownership if userId provided
  if (userId && teamMember && teamMember.team.userId !== userId) {
    throw new Error("Access denied")
  }

  return teamMember
}

/**
 * Create a team member
 * @param data - Team member data
 * @returns Created team member
 */
export const createTeamMember = async (data: {
  teamId: string
  name: string
  role: string
  gender: string
  birthday: Date
  phone?: string
  lineId?: string
  email?: string
}) => {
  return await prisma.team_member.create({
    data: {
      ...data,
      updatedAt: new Date(),
    },
    include: {
      team: true,
    },
  })
}

/**
 * Create multiple team members
 * @param teamId - Team ID
 * @param members - Array of member data
 * @returns Array of created team members
 */
export const createTeamMembers = async (
  teamId: string,
  members: Array<{
    name: string
    role: string
    gender: string
    birthday: Date
    phone?: string
    lineId?: string
    email?: string
  }>,
) => {
  const memberData = members.map((member) => ({
    teamId,
    ...member,
    updatedAt: new Date(),
  }))

  await prisma.team_member.createMany({
    data: memberData,
  })

  // Since we can't get the IDs from createMany, return all members for the team
  // created within the last few seconds (to get the newly created ones)
  const cutoffTime = new Date(Date.now() - 10000) // 10 seconds ago
  return await prisma.team_member.findMany({
    where: {
      teamId,
      createdAt: {
        gte: cutoffTime,
      },
    },
    include: {
      team: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })
}

/**
 * Update a team member
 * @param id - Team member ID
 * @param data - Updated team member data
 * @param userId - User ID for ownership check
 * @returns Updated team member
 */
export const updateTeamMember = async (
  id: string,
  data: {
    name?: string
    role?: string
    gender?: string
    birthday?: Date
    phone?: string
    lineId?: string
    email?: string
    isBanned?: boolean
    banReason?: string
    banUntil?: Date
  },
  userId?: string,
) => {
  // Check ownership if userId provided
  if (userId) {
    const member = await prisma.team_member.findFirst({
      where: { id },
      include: { team: true },
    })
    if (!member || member.team.userId !== userId) {
      throw new Error("Team member not found or access denied")
    }
  }

  return await prisma.team_member.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
    },
    include: {
      team: true,
    },
  })
}

/**
 * Delete a team member
 * @param id - Team member ID
 * @param userId - User ID for ownership check
 * @returns Deleted team member
 */
export const deleteTeamMember = async (id: string, userId?: string) => {
  // Check ownership if userId provided
  if (userId) {
    const member = await prisma.team_member.findFirst({
      where: { id },
      include: { team: true },
    })
    if (!member || member.team.userId !== userId) {
      throw new Error("Team member not found or access denied")
    }
  }

  return await prisma.team_member.delete({
    where: { id },
  })
}
