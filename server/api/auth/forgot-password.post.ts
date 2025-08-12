import { z } from "zod"
import { auth } from "../../../auth"

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
  redirectTo: z.string().url().optional(),
})

/**
 * Handle forgot password request using Better Auth
 * Sends a password reset link to the user's email
 */
export default defineEventHandler(async (event) => {
  try {
    // Parse request body
    const body = await readBody(event)

    // Validate input
    const { email, redirectTo } = forgotPasswordSchema.parse(body)

    // Use Better Auth's built-in requestPasswordReset
    await auth.api.requestPasswordReset({
      body: {
        email,
        redirectTo:
          redirectTo ||
          `${getRequestURL(event).origin}/accounts/reset-password`,
      },
      asResponse: true,
    })

    // Better Auth already handles the logic internally
    return {
      success: true,
      message:
        "If the email is registered, you will receive a password reset link",
    }
  } catch (error) {
    console.error("Forgot password error:", error)

    // Handle validation errors
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid request data",
        data: error.issues,
      })
    }

    // Handle other errors
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    })
  }
})
