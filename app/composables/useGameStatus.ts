import type { Game, GameStatus, GameStatusColor } from "~/types/game"

/**
 * Composable for game status related utilities
 * @returns Object containing game status functions
 */
export const useGameStatus = () => {
  /**
   * Get the current status of a game based on dates
   * @param game - The game object
   * @returns The current game status
   */
  const getGameStatus = (game: Game): GameStatus => {
    const now = new Date()
    const signupStart = new Date(game.signupStart)
    const signupEnd = new Date(game.signupEnd)
    const gameStart = new Date(game.gameStart)
    const gameEnd = new Date(game.gameEnd)

    if (now < signupStart) return "upcoming"
    if (now >= signupStart && now <= signupEnd) return "registration"
    if (now > signupEnd && now < gameStart) return "closed"
    if (now >= gameStart && now <= gameEnd) return "ongoing"
    return "ended"
  }

  /**
   * Get the display text for a game status
   * @param status - The game status
   * @returns The localized status text
   */
  const getStatusText = (status: GameStatus): string => {
    const statusMap = {
      upcoming: "即將開放報名",
      registration: "報名進行中",
      closed: "報名已截止",
      ongoing: "賽事進行中",
      ended: "賽事已結束",
    } as const
    return statusMap[status] || "未知"
  }

  /**
   * Get the color variant for a game status badge
   * @param status - The game status
   * @returns The color variant for the badge
   */
  const getStatusColor = (status: GameStatus): GameStatusColor => {
    const colorMap = {
      upcoming: "primary",
      registration: "success",
      closed: "warning",
      ongoing: "info",
      ended: "neutral",
    } as const
    return colorMap[status] || "neutral"
  }

  return {
    getGameStatus,
    getStatusText,
    getStatusColor,
  }
}
