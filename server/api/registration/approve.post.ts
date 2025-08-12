import { updateRegistrationStatus } from "~~/server/utils/registrations"

/**
 * Approve a registration.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { id } = body

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "報名 ID 為必填項目",
    })
  }

  try {
    const updatedRegistration = await updateRegistrationStatus(id, "approved")

    return { data: updatedRegistration }
  } catch (error) {
    console.error("Approve registration error:", error)
    throw createError({
      statusCode: 500,
      statusMessage: "批准報名失敗",
    })
  }
})
