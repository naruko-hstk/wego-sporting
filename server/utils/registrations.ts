import { prisma } from "./prisma"

/**
 * Get all registrations for a specific game
 * @param gameId - The game ID to fetch registrations for
 * @returns Array of registrations with user, game_category, team, and participant data
 */
export const getGameRegistrations = async (gameId: string) => {
  try {
    const registrations = await prisma.registration.findMany({
      where: {
        gameId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        game_category: true,
        team: true,
        registration_participant: {
          include: {
            team_member: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return registrations
  } catch (error) {
    console.error("Error fetching game registrations:", error)
    throw error
  }
}

/**
 * Get all registrations with filters
 * @param filters - Filter options
 * @returns Array of registrations
 */
export const getRegistrations = async (filters?: {
  gameId?: string
  categoryId?: string
  teamId?: string
  userId?: string
  status?: string
  limit?: number
  offset?: number
}) => {
  const where: Record<string, unknown> = {}

  if (filters?.gameId) where.gameId = filters.gameId
  if (filters?.categoryId) where.categoryId = filters.categoryId
  if (filters?.teamId) where.teamId = filters.teamId
  if (filters?.userId) where.registrantUserId = filters.userId
  if (filters?.status) where.status = filters.status

  return await prisma.registration.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      game: true,
      game_category: true,
      team: true,
      registration_participant: {
        include: {
          team_member: true,
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
 * Create a new registration
 * @param data - Registration data
 * @returns Created registration
 */
export const createRegistration = async (data: {
  gameId: string
  categoryId: string
  teamId: string
  registrantUserId: string
  participants: string[]
  note?: string
}) => {
  return await prisma.registration.create({
    data: {
      gameId: data.gameId,
      categoryId: data.categoryId,
      teamId: data.teamId,
      registrantUserId: data.registrantUserId,
      status: "pending",
      note: data.note || null,
      updatedAt: new Date(),
      registration_participant: {
        create: data.participants.map((memberId: string, index: number) => ({
          teamMemberId: memberId,
          isMainPlayer: index === 0,
          updatedAt: new Date(),
        })),
      },
    },
    include: {
      game: true,
      game_category: true,
      team: true,
      registration_participant: {
        include: {
          team_member: true,
        },
      },
    },
  })
}

/**
 * Check if registration exists
 * @param gameId - Game ID
 * @param categoryId - Category ID
 * @param teamId - Team ID
 * @returns Registration if exists
 */
export const findExistingRegistration = async (
  gameId: string,
  categoryId: string,
  teamId: string,
) => {
  return await prisma.registration.findFirst({
    where: {
      gameId,
      categoryId,
      teamId,
    },
  })
}

/**
 * Update registration status
 * @param registrationId - The registration ID to update
 * @param status - The new status ('approved', 'rejected', 'pending')
 * @param reviewedBy - The user ID who reviewed
 * @returns Updated registration
 */
export const updateRegistrationStatus = async (
  registrationId: string,
  status: "approved" | "rejected" | "pending",
  reviewedBy?: string,
) => {
  try {
    console.log("Utils: updateRegistrationStatus called with:", {
      registrationId,
      status,
    })

    const updatedRegistration = await prisma.registration.update({
      where: {
        id: registrationId,
      },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedBy: reviewedBy || null,
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
        game_category: true,
      },
    })

    console.log(
      "Utils: Successfully updated registration:",
      updatedRegistration,
    )
    return updatedRegistration
  } catch (error) {
    console.error("Utils: Error updating registration status:", error)
    throw error
  }
}

/**
 * Update registration data
 * @param registrationId - Registration ID
 * @param data - Updated registration data
 * @returns Updated registration
 */
export const updateRegistration = async (
  registrationId: string,
  data: {
    note?: string
    participants?: string[]
  },
) => {
  return await prisma.$transaction(async (tx) => {
    // Update registration
    await tx.registration.update({
      where: { id: registrationId },
      data: {
        note: data.note,
        updatedAt: new Date(),
      },
    })

    // Update participants if provided
    if (data.participants) {
      // Delete existing participants
      await tx.registration_participant.deleteMany({
        where: { registrationId },
      })

      // Create new participants
      await tx.registration_participant.createMany({
        data: data.participants.map((memberId: string, index: number) => ({
          registrationId,
          teamMemberId: memberId,
          isMainPlayer: index === 0,
          updatedAt: new Date(),
        })),
      })
    }

    return await tx.registration.findUnique({
      where: { id: registrationId },
      include: {
        game: true,
        game_category: true,
        team: true,
        registration_participant: {
          include: {
            team_member: true,
          },
        },
      },
    })
  })
}

/**
 * Get registration by ID
 * @param registrationId - The registration ID
 * @returns Registration with user and game category data
 */
export const getRegistrationById = async (registrationId: string) => {
  try {
    const registration = await prisma.registration.findUnique({
      where: {
        id: registrationId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        game: true,
        game_category: true,
        team: true,
        registration_participant: {
          include: {
            team_member: true,
          },
        },
      },
    })

    return registration
  } catch (error) {
    console.error("Error fetching registration by ID:", error)
    throw error
  }
}

/**
 * Delete a registration
 * @param registrationId - Registration ID
 * @returns Deleted registration
 */
export const deleteRegistration = async (registrationId: string) => {
  return await prisma.registration.delete({
    where: { id: registrationId },
  })
}

/**
 * Get registration participants
 * @param registrationId - Registration ID
 * @returns Array of registration participants
 */
export const getRegistrationParticipants = async (registrationId?: string) => {
  const where: Record<string, unknown> = {}
  if (registrationId) where.registrationId = registrationId

  return await prisma.registration_participant.findMany({
    where,
    include: {
      registration: {
        include: {
          game: true,
          game_category: true,
          team: true,
        },
      },
      team_member: true,
    },
    orderBy: {
      isMainPlayer: "desc",
    },
  })
}
