import { authClient } from "~~/auth-client"
import type { Game } from "~/types/game"

interface User {
  id: string
  name: string
  email: string
  image?: string
  role?: string
  banned?: boolean
  createdAt: string
  username?: string
}

/**
 * Dashboard statistics composable for managing dashboard stats data
 */
export const useDashboardStats = () => {
  const statistics = ref<{
    gamesCount?: number
    usersCount?: number
    monthlyRegistrations?: number
  }>({})

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Refresh dashboard statistics
   */
  const refresh = async () => {
    try {
      isLoading.value = true
      error.value = null

      // Wait for session to be ready
      const session = await authClient.getSession()

      if (!session.data?.user) {
        console.log("No session available, skipping dashboard stats refresh")
        return
      }

      console.log("Dashboard session:", session)
      console.log("User role:", session.data.user.role)

      // Check if user has admin/owner role
      if (!["admin", "owner"].includes(session.data.user.role || "")) {
        console.log("User does not have admin permissions, skipping stats")
        return
      }

      // Fetch users count and monthly registrations
      const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format
      const usersResult = await $fetch<{
        users: User[]
        total: number
      }>("/api/admin/users")

      // Calculate monthly registrations
      const monthlyUsers = usersResult.users.filter((user) =>
        user.createdAt.startsWith(currentMonth),
      )

      // Fetch all games to get count
      const gamesResult = await $fetch<Game[]>("/api/games")

      statistics.value = {
        gamesCount: Array.isArray(gamesResult) ? gamesResult.length : 0,
        usersCount: usersResult.total ?? 0,
        monthlyRegistrations: monthlyUsers.length,
      }

      console.log("Dashboard statistics updated:", statistics.value)
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to load dashboard statistics"
      error.value = errorMessage
      console.error("Failed to refresh dashboard statistics:", err)

      // Keep existing values or set to 0 on error
      statistics.value = {
        gamesCount: statistics.value.gamesCount ?? 0,
        usersCount: statistics.value.usersCount ?? 0,
        monthlyRegistrations: statistics.value.monthlyRegistrations ?? 0,
      }
    } finally {
      isLoading.value = false
    }
  }

  return {
    statistics: readonly(statistics),
    isLoading: readonly(isLoading),
    error: readonly(error),
    refresh,
  }
}
