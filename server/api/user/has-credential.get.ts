import { auth } from "~~/auth"
import { prisma } from "~~/server/utils/prisma"

/**
 * Check if user has credential account (email/password)
 * @description Returns whether the current user has a password-based account
 */
export default defineEventHandler(async (event) => {
  try {
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
        statusMessage: "未登入",
      })
    }

    // 檢查用戶是否有 credential 類型的帳號（有密碼）
    const credentialAccount = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        providerId: "credential",
        password: {
          not: null,
        },
      },
    })

    return {
      hasCredential: !!credentialAccount,
    }
  } catch (error) {
    console.error("檢查用戶憑證錯誤:", error)

    // If it's already a structured error, throw it
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error
    }

    // Otherwise, throw a generic error
    throw createError({
      statusCode: 500,
      statusMessage: "檢查憑證時發生錯誤",
    })
  }
})
