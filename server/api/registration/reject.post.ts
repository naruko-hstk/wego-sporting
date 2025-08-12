import { updateRegistrationStatus } from "~~/server/utils/registrations"

/**
 * Reject a registration.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { id } = body

  console.log("Reject API called with ID:", id)

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "報名 ID 為必填項目",
    })
  }

  try {
    console.log("Attempting to reject registration with ID:", id)
    const updatedRegistration = await updateRegistrationStatus(id, "rejected")
    console.log("Successfully rejected registration:", updatedRegistration)

    return { data: updatedRegistration }
  } catch (error) {
    console.error("Reject registration error:", error)
    throw createError({
      statusCode: 500,
      statusMessage: "拒絕報名失敗",
    })
  }
})
