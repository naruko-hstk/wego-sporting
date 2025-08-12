import type {
  UserPlayer,
  CreateUserPlayerRequest,
  UpdateUserPlayerRequest,
} from "~/types/team"

/**
 * Composable for managing user players
 */
export const useUserPlayer = () => {
  /**
   * Get user players list
   * @returns User players list
   */
  const getUserPlayers = async (): Promise<UserPlayer[]> => {
    const data = await $fetch<UserPlayer[]>("/api/user_player")
    return data || []
  }

  /**
   * Create user player
   * @param playerData - Player data
   * @returns Created player
   */
  const createUserPlayer = async (
    playerData: CreateUserPlayerRequest,
  ): Promise<UserPlayer> => {
    return await $fetch<UserPlayer>("/api/user_player", {
      method: "POST",
      body: playerData,
    })
  }

  /**
   * Update user player
   * @param id - Player ID
   * @param playerData - Updated player data
   * @returns Updated player
   */
  const updateUserPlayer = async (
    id: string,
    playerData: UpdateUserPlayerRequest,
  ): Promise<UserPlayer> => {
    return await $fetch<UserPlayer>(`/api/user_player/${id}`, {
      method: "PUT",
      body: playerData,
    })
  }

  /**
   * Delete user player
   * @param id - Player ID
   * @returns Success status
   */
  const deleteUserPlayer = async (
    id: string,
  ): Promise<{ success: boolean }> => {
    return await $fetch<{ success: boolean }>(`/api/user_player/${id}`, {
      method: "DELETE",
    })
  }

  /**
   * Ban user player
   * @param id - Player ID
   * @param banReason - Ban reason
   * @param banUntil - Ban expiry date (optional)
   * @returns Updated player
   */
  const banUserPlayer = async (
    id: string,
    banReason: string,
    banUntil?: string,
  ): Promise<UserPlayer> => {
    return await updateUserPlayer(id, {
      isBanned: true,
      banReason,
      banUntil,
    })
  }

  /**
   * Unban user player
   * @param id - Player ID
   * @returns Updated player
   */
  const unbanUserPlayer = async (id: string): Promise<UserPlayer> => {
    return await updateUserPlayer(id, {
      isBanned: false,
      banReason: undefined,
      banUntil: undefined,
    })
  }

  return {
    getUserPlayers,
    createUserPlayer,
    updateUserPlayer,
    deleteUserPlayer,
    banUserPlayer,
    unbanUserPlayer,
  }
}
