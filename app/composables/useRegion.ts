import {
  getRegionName,
  getRegionCode,
  getRegionOptions,
  isValidRegionCode,
  isValidRegionName,
} from "~/utils/region"

/**
 * 地區轉換 Composable
 * 提供在 Vue 組件中使用的地區轉換功能
 */
export const useRegion = () => {
  return {
    getRegionName,
    getRegionCode,
    getRegionOptions,
    isValidRegionCode,
    isValidRegionName,
  }
}
