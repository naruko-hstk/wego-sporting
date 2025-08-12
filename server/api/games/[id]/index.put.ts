import { prisma } from "~~/server/utils/prisma"
import { auth } from "~~/auth"
import { randomUUID } from "crypto"

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

  const gameId = getRouterParam(event, "id")
  if (!gameId) {
    throw createError({
      statusCode: 400,
      statusMessage: "缺少賽事 ID",
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
    // 檢查賽事是否存在
    const existingGame = await prisma.game.findUnique({
      where: { id: gameId },
    })

    if (!existingGame) {
      throw createError({
        statusCode: 404,
        statusMessage: "賽事不存在",
      })
    }

    // 使用 transaction 確保資料一致性
    const result = await prisma.$transaction(async (tx) => {
      // 更新賽事基本資料
      const game = await tx.game.update({
        where: { id: gameId },
        data: {
          name: body.name,
          region: body.region,
          venue: body.venue,
          address: body.address,
          signupStart,
          signupEnd,
          gameStart,
          gameEnd,
          updatedAt: new Date(),
        },
      })

      // 更新或建立賽事詳情
      if (body.description || body.basis || body.note || body.feeInfo) {
        await tx.game_detail.upsert({
          where: { gameId: game.id },
          update: {
            basis: body.basis || null,
            note: body.note || null,
            updatedAt: new Date(),
          },
          create: {
            id: randomUUID(),
            gameId: game.id,
            basis: body.basis || null,
            note: body.note || null,
            updatedAt: new Date(),
          },
        })
      }

      // 重新建立費用和分類（簡單做法：刪除舊的，建立新的）
      if (
        body.fees &&
        Array.isArray(body.fees) &&
        body.categories &&
        Array.isArray(body.categories)
      ) {
        // 刪除現有分類和費用（級聯刪除會自動處理）
        await tx.game_category.deleteMany({
          where: { gameId: game.id },
        })
        await tx.game_fee.deleteMany({
          where: { gameId: game.id },
        })

        // 先建立分類並取得 ID，然後建立費用
        const createdCategories = await Promise.all(
          body.categories.map(
            async (
              category: { categoryName: string; conditions?: string },
              index: number,
            ) => {
              const categoryId = randomUUID()
              const createdCategory = await tx.game_category.create({
                data: {
                  id: categoryId,
                  gameId: game.id,
                  categoryName: category.categoryName,
                  conditions: category.conditions,
                },
              })
              return { ...createdCategory, originalIndex: index }
            },
          ),
        )

        // 建立費用並關聯到對應的分類
        for (const fee of body.fees) {
          if (fee.categoryIndex !== undefined) {
            const relatedCategory = createdCategories.find(
              (cat) => cat.originalIndex === fee.categoryIndex,
            )
            if (relatedCategory) {
              const feeId = randomUUID()
              await tx.game_fee.create({
                data: {
                  id: feeId,
                  gameId: game.id,
                  categoryId: relatedCategory.id, // 建立與分類的關聯
                  feeType: fee.feeType,
                  description: fee.description || "",
                  amount: fee.amount,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              })
            }
          } else {
            // 如果沒有指定分類，則建立通用費用
            const feeId = randomUUID()
            await tx.game_fee.create({
              data: {
                id: feeId,
                gameId: game.id,
                categoryId: null,
                feeType: fee.feeType,
                description: fee.description || "",
                amount: fee.amount,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            })
          }
        }
      } else if (body.categories && Array.isArray(body.categories)) {
        // 只有分類沒有費用的情況
        await tx.game_category.deleteMany({
          where: { gameId: game.id },
        })

        for (const category of body.categories) {
          const categoryId = randomUUID()
          await tx.game_category.create({
            data: {
              id: categoryId,
              gameId: game.id,
              categoryName: category.categoryName,
              conditions: category.conditions,
            },
          })
        }
      }

      return game
    })

    return result
  } catch (error) {
    console.error("更新賽事失敗:", error)
    throw createError({
      statusCode: 500,
      statusMessage: "更新賽事失敗",
    })
  }
})
