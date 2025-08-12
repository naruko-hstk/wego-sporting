/**
 * 地區轉換工具函數
 * 可在任何地方使用，不限於 Vue 組件
 */

export const REGION_MAP: Record<string, string> = {
  keelung: "基隆市",
  "new-taipei": "新北市",
  taipei: "臺北市",
  taoyuan: "桃園市",
  "hsinchu-city": "新竹市",
  "hsinchu-county": "新竹縣",
  miaoli: "苗栗縣",
  taichung: "臺中市",
  changhua: "彰化縣",
  nantou: "南投縣",
  yunlin: "雲林縣",
  "chiayi-city": "嘉義市",
  "chiayi-county": "嘉義縣",
  tainan: "臺南市",
  kaohsiung: "高雄市",
  pingtung: "屏東縣",
  yilan: "宜蘭縣",
  hualien: "花蓮縣",
  taitung: "臺東縣",
  penghu: "澎湖縣",
  kinmen: "金門縣",
  lienchiang: "連江縣",
}

/**
 * 將地區代碼轉換為中文名稱
 * @param regionCode 地區代碼（英文）
 * @returns 中文地區名稱，如果找不到則返回原始代碼
 */
export const getRegionName = (regionCode: string): string => {
  return REGION_MAP[regionCode] || regionCode
}

/**
 * 將中文地區名稱轉換為代碼
 * @param regionName 中文地區名稱
 * @returns 地區代碼，如果找不到則返回原始名稱
 */
export const getRegionCode = (regionName: string): string => {
  const reverseMap = Object.fromEntries(
    Object.entries(REGION_MAP).map(([code, name]) => [name, code]),
  )
  return reverseMap[regionName] || regionName
}

/**
 * 取得所有地區選項
 * @returns 包含 { value: code, label: name } 的陣列
 */
export const getRegionOptions = () => {
  return Object.entries(REGION_MAP).map(([code, name]) => ({
    value: code,
    label: name,
  }))
}

/**
 * 檢查地區代碼是否有效
 * @param regionCode 地區代碼
 * @returns 是否為有效的地區代碼
 */
export const isValidRegionCode = (regionCode: string): boolean => {
  return regionCode in REGION_MAP
}

/**
 * 檢查地區名稱是否有效
 * @param regionName 地區名稱
 * @returns 是否為有效的地區名稱
 */
export const isValidRegionName = (regionName: string): boolean => {
  return Object.values(REGION_MAP).includes(regionName)
}
