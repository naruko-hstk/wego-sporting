import { z } from "zod"
import { auth } from "~~/auth"

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "請輸入目前密碼"),
  newPassword: z
    .string()
    .min(8, "密碼至少需要 8 個字元")
    .max(128, "密碼最多 128 個字元"),
})

/**
 * Change password for users with existing credentials
 * @description Allows users to change their existing password
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

    // 解析並驗證請求資料
    const body = await readBody(event)
    const { currentPassword, newPassword } = changePasswordSchema.parse(body)

    // 使用 better-auth 的 changePassword API
    const result = await auth.api.changePassword({
      body: {
        currentPassword,
        newPassword,
      },
      headers,
      asResponse: true,
    })

    if (!result.ok) {
      const errorData = await result.json()
      throw createError({
        statusCode: result.status,
        statusMessage: errorData.message || "變更密碼失敗",
      })
    }

    return {
      success: true,
      message: "密碼變更成功",
    }
  } catch (error) {
    console.error("變更密碼錯誤:", error)

    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: error.issues[0]?.message || "資料驗證失敗",
      })
    }

    // If it's already a structured error, throw it
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error
    }

    // Otherwise, throw a generic error
    throw createError({
      statusCode: 500,
      statusMessage: "變更密碼時發生錯誤",
    })
  }
})
