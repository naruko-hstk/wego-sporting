import { auth } from "~~/auth"
import { prisma } from "~~/server/utils/prisma"
import { randomUUID } from "crypto"

/**
 * Batch add team members to a team
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { teamId, members } = body

    if (!teamId || !members || !Array.isArray(members)) {
      throw createError({
        statusCode: 400,
        statusMessage: "請提供有效的隊伍 ID 和成員資料",
      })
    }

    // 獲取使用者 session
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

    // 驗證隊伍是否屬於該使用者
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        userId: session.user.id,
      },
    })

    if (!team) {
      throw createError({
        statusCode: 404,
        statusMessage: "找不到隊伍或無權限操作",
      })
    }

    // 批量新增隊職員
    const teamMembers = await Promise.all(
      members.map(async (member: any) => {
        return await prisma.team_member.create({
          data: {
            id: randomUUID(),
            teamId,
            name: member.name,
            role: member.role || "選手",
            gender: member.gender || "M",
            birthday: new Date(member.birthday),
            phone: member.phone || null,
            lineId: member.lineId || null,
            email: member.email || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        })
      }),
    )

    return {
      success: true,
      members: teamMembers,
    }
  } catch (error) {
    console.error("Batch add team members error:", error)
    throw createError({
      statusCode: 500,
      statusMessage: "批量新增隊職員失敗",
    })
  }
})
