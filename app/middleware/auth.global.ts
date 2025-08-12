import { authClient } from "~~/auth-client"

export default defineNuxtRouteMiddleware(async (to) => {
  const { data: session } = await authClient.useSession(useFetch)
  if (to.path.startsWith("/dashboard")) {
    const role = session.value?.user?.role
    if (!role || (role !== "admin" && role !== "owner")) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
      })
    }
  }
})
