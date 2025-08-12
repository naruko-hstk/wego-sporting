import { authClient } from "~~/auth-client"

export interface UserListQuery {
  searchValue?: string
  searchField?: "email" | "name"
  searchOperator?: "contains" | "starts_with" | "ends_with"
  limit?: number
  offset?: number
  sortBy?: string
  sortDirection?: "asc" | "desc"
  filterField?: string
  filterValue?: string | number | boolean
  filterOperator?: "eq" | "ne" | "lt" | "lte" | "gt" | "gte"
}

export interface UserListResult {
  users: User[]
  total: number
  limit?: number
  offset?: number
}

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
 * User management composable for admin operations
 */
export const useUserManagement = () => {
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const users = ref<UserListResult | null>(null)

  /**
   * List users with pagination and filtering
   */
  const listUsers = async (query: UserListQuery = {}) => {
    isLoading.value = true
    error.value = null

    try {
      console.log("Attempting to list users with query:", query)

      // 使用自定義 API 而不是 Better Auth admin API
      const data = await $fetch<UserListResult>("/api/admin/users", {
        query,
      })

      console.log("Custom API listUsers result:", data)

      users.value = data
      console.log("Users data set successfully:", data)
      return data
    } catch (err) {
      console.error("Exception in listUsers:", err)
      console.error("Error details:", {
        message: err instanceof Error ? err.message : "Unknown error",
        stack: err instanceof Error ? err.stack : undefined,
        fullError: err,
      })
      error.value =
        err instanceof Error ? err.message : "Unknown error occurred"
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create a new user
   */
  const createUser = async (userData: {
    email: string
    password: string
    name: string
    role?: "user" | "admin" | ("user" | "admin")[]
    data?: Record<string, unknown>
  }) => {
    isLoading.value = true
    error.value = null

    try {
      const result = await authClient.admin.createUser(userData)

      if (result.error) {
        error.value = result.error.message || "Failed to create user"
        return null
      }

      // Refresh user list after creation
      await listUsers()
      return result.data
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Unknown error occurred"
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Set user role
   */
  const setUserRole = async (userId: string, role: "user" | "admin") => {
    isLoading.value = true
    error.value = null

    try {
      console.log("Attempting to set user role:", { userId, role })

      const result = await $fetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        body: { role },
      })

      console.log("Set role result:", result)

      // Refresh user list after role change
      await listUsers()
      return true
    } catch (err) {
      console.error("Exception in setUserRole:", err)
      error.value =
        err instanceof Error ? err.message : "Unknown error occurred"
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Ban a user
   */
  const banUser = async (
    userId: string,
    banReason?: string,
    banExpiresIn?: number,
  ) => {
    isLoading.value = true
    error.value = null

    try {
      console.log("Attempting to ban user:", {
        userId,
        banReason,
        banExpiresIn,
      })

      const result = await $fetch(`/api/admin/users/${userId}/ban`, {
        method: "POST",
        body: { banReason, banExpiresIn },
      })

      console.log("Ban user result:", result)

      // Refresh user list after ban
      await listUsers()
      return true
    } catch (err) {
      console.error("Exception in banUser:", err)
      error.value =
        err instanceof Error ? err.message : "Unknown error occurred"
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Unban a user
   */
  const unbanUser = async (userId: string) => {
    isLoading.value = true
    error.value = null

    try {
      console.log("Attempting to unban user:", userId)

      const result = await $fetch(`/api/admin/users/${userId}/unban`, {
        method: "POST",
      })

      console.log("Unban user result:", result)

      // Refresh user list after unban
      await listUsers()
      return true
    } catch (err) {
      console.error("Exception in unbanUser:", err)
      error.value =
        err instanceof Error ? err.message : "Unknown error occurred"
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Remove a user (hard delete)
   */
  const removeUser = async (userId: string) => {
    isLoading.value = true
    error.value = null

    try {
      console.log("Attempting to remove user:", userId)

      const result = await $fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      })

      console.log("Remove user result:", result)

      // Refresh user list after removal
      await listUsers()
      return true
    } catch (err) {
      console.error("Exception in removeUser:", err)
      error.value =
        err instanceof Error ? err.message : "Unknown error occurred"
      return false
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    isLoading: readonly(isLoading),
    error: readonly(error),
    users: readonly(users),

    // Methods
    listUsers,
    createUser,
    setUserRole,
    banUser,
    unbanUser,
    removeUser,
  }
}
