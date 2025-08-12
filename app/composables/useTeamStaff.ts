import type {
  TeamStaff,
  CreateTeamStaffRequest,
  UpdateTeamStaffRequest,
} from "~/types/team"

/**
 * Composable for managing team staff
 */
export const useTeamStaff = () => {
  /**
   * Get team staff list
   * @param teamId - Optional team ID filter
   * @param role - Optional role filter
   * @returns Team staff list
   */
  const getTeamStaff = async (
    teamId?: string,
    role?: string,
  ): Promise<TeamStaff[]> => {
    const query: Record<string, string> = {}
    if (teamId) query.teamId = teamId
    if (role) query.role = role

    const data = await $fetch<TeamStaff[]>("/api/team_staff", {
      query,
    })

    return data || []
  }

  /**
   * Create team staff
   * @param staffData - Staff data
   * @returns Created staff
   */
  const createTeamStaff = async (
    staffData: CreateTeamStaffRequest,
  ): Promise<TeamStaff> => {
    return await $fetch<TeamStaff>("/api/team_staff", {
      method: "POST",
      body: staffData,
    })
  }

  /**
   * Update team staff
   * @param id - Staff ID
   * @param staffData - Updated staff data
   * @returns Updated staff
   */
  const updateTeamStaff = async (
    id: string,
    staffData: UpdateTeamStaffRequest,
  ): Promise<TeamStaff> => {
    return await $fetch<TeamStaff>(`/api/team_staff/${id}`, {
      method: "PUT",
      body: staffData,
    })
  }

  /**
   * Delete team staff
   * @param id - Staff ID
   * @returns Success status
   */
  const deleteTeamStaff = async (id: string): Promise<{ success: boolean }> => {
    return await $fetch<{ success: boolean }>(`/api/team_staff/${id}`, {
      method: "DELETE",
    })
  }

  return {
    getTeamStaff,
    createTeamStaff,
    updateTeamStaff,
    deleteTeamStaff,
  }
}
