/**
 * Composable for date formatting utilities
 * @returns Object containing date formatting functions
 */
export const useDateFormatter = () => {
  /**
   * Format date to Taiwan locale string
   * @param date - Date string or Date object
   * @param options - Intl.DateTimeFormatOptions
   * @returns Formatted date string
   */
  const formatDate = (
    date: string | Date,
    options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    },
  ): string => {
    return new Intl.DateTimeFormat("zh-TW", options).format(new Date(date))
  }

  /**
   * Format date to short format (MM/DD)
   * @param date - Date string or Date object
   * @returns Short formatted date string
   */
  const formatShortDate = (date: string | Date): string => {
    return formatDate(date, {
      month: "2-digit",
      day: "2-digit",
    })
  }

  /**
   * Format date to time only (HH:MM)
   * @param date - Date string or Date object
   * @returns Time formatted string
   */
  const formatTime = (date: string | Date): string => {
    return formatDate(date, {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  /**
   * Get relative time from now
   * @param date - Date string or Date object
   * @returns Relative time string
   */
  const getRelativeTime = (date: string | Date): string => {
    const now = new Date()
    const targetDate = new Date(date)
    const diffInMs = targetDate.getTime() - now.getTime()
    const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return "今天"
    if (diffInDays === 1) return "明天"
    if (diffInDays === -1) return "昨天"
    if (diffInDays > 1) return `${diffInDays} 天後`
    if (diffInDays < -1) return `${Math.abs(diffInDays)} 天前`

    return formatDate(date)
  }

  /**
   * Format date range to localized string
   * @param startDate - The start date string
   * @param endDate - The end date string
   * @returns Formatted date range string
   */
  const formatDateRange = (startDate: string, endDate: string): string => {
    return `${formatDate(startDate)} 至 ${formatDate(endDate)}`
  }

  return {
    formatDate,
    formatShortDate,
    formatTime,
    getRelativeTime,
    formatDateRange,
  }
}
