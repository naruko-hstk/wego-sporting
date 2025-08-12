import { createGame } from "~~/server/utils/games"
import { auth } from "~~/auth"

export default defineEventHandler(async (event) => {
  // 檢查使用者是否已登入且為管理員
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session || !session.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "未授權",
    })
  }

  // 檢查使用者是否為管理員
  if (!["admin", "owner"].includes(session.user.role || "")) {
    throw createError({
      statusCode: 403,
      statusMessage: "權限不足",
    })
  }

  const body = await readBody(event)

  // 驗證必要欄位
  const requiredFields = [
    "name",
    "region",
    "venue",
    "address",
    "signupStart",
    "signupEnd",
    "gameStart",
    "gameEnd",
  ]

  for (const field of requiredFields) {
    if (!body[field]) {
      throw createError({
        statusCode: 400,
        statusMessage: `缺少必要欄位: ${field}`,
      })
    }
  }

  // 驗證時間邏輯，將輸入視為本地時間（+08:00）
  function parseLocalDate(str: string) {
    // 若已帶時區則直接 new Date
    if (/Z|[+-]\d{2}:?\d{2}$/.test(str)) return new Date(str)
    // 否則補 +08:00
    return new Date(str + "T00:00:00+08:00")
  }
  const signupStart = parseLocalDate(body.signupStart)
  const signupEnd = parseLocalDate(body.signupEnd)
  const gameStart = parseLocalDate(body.gameStart)
  const gameEnd = parseLocalDate(body.gameEnd)

  if (signupStart >= signupEnd) {
    throw createError({
      statusCode: 400,
      statusMessage: "報名開始時間必須早於報名結束時間",
    })
  }

  if (signupEnd >= gameStart) {
    throw createError({
      statusCode: 400,
      statusMessage: "報名結束時間必須早於賽事開始時間",
    })
  }

  if (gameStart > gameEnd) {
    throw createError({
      statusCode: 400,
      statusMessage: "賽事開始時間必須早於賽事結束時間",
    })
  }

  try {
    const result = await createGame({
      name: body.name,
      region: body.region,
      venue: body.venue,
      address: body.address,
      signupStart,
      signupEnd,
      gameStart,
      gameEnd,
      basis: body.basis,
      note: body.note,
      categories: body.categories,
      fees: body.fees,
    })

    return result
  } catch (error) {
    console.error("建立賽事失敗:", error)
    throw createError({
      statusCode: 500,
      statusMessage: "建立賽事失敗",
    })
  }
})
