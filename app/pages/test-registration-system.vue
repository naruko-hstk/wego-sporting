<template>
  <div class="container mx-auto space-y-8 p-4">
    <h1 class="mb-6 text-3xl font-bold">報名系統測試</h1>

    <!-- 測試賽事連結 -->
    <div class="rounded-lg bg-white p-6 shadow">
      <h2 class="mb-4 text-2xl font-semibold">測試報名流程</h2>
      <div class="space-y-4">
        <p class="text-gray-600">請先確保您已經設定好：</p>
        <ul class="list-disc space-y-2 pl-6 text-gray-600">
          <li>
            個人隊員資料（在
            <NuxtLink
              to="/accounts/profile"
              class="text-blue-600 hover:underline"
              >個人資料</NuxtLink
            >
            頁面）
          </li>
          <li>隊伍和隊職員（如需要團隊報名）</li>
        </ul>

        <div class="flex gap-4">
          <UButton to="/test-new-structure" color="blue">
            測試隊伍&隊員管理
          </UButton>
          <UButton to="/test-game-categories" color="green">
            測試賽事分類管理
          </UButton>
          <UButton to="/games/test-game-id/signup-new" color="orange">
            測試新版報名頁面
          </UButton>
        </div>
      </div>
    </div>

    <!-- 建立測試賽事 -->
    <div class="rounded-lg bg-white p-6 shadow">
      <h2 class="mb-4 text-2xl font-semibold">建立測試賽事</h2>
      <form class="space-y-4" @submit.prevent="createTestGame">
        <UFormGroup label="賽事名稱">
          <UInput
            v-model="testGame.name"
            placeholder="例如：2024年度跆拳道錦標賽"
          />
        </UFormGroup>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <UFormGroup label="比賽日期">
            <UInput v-model="testGame.gameDate" type="date" />
          </UFormGroup>

          <UFormGroup label="報名截止">
            <UInput v-model="testGame.signupEnd" type="date" />
          </UFormGroup>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <UFormGroup label="比賽地點">
            <UInput
              v-model="testGame.location"
              placeholder="例如：台北體育館"
            />
          </UFormGroup>

          <UFormGroup label="主辦單位">
            <UInput
              v-model="testGame.organizer"
              placeholder="例如：中華民國跆拳道協會"
            />
          </UFormGroup>
        </div>

        <UButton type="submit" :loading="creating" :disabled="!testGame.name">
          建立測試賽事
        </UButton>
      </form>
    </div>

    <!-- 導入真實賽事 -->
    <div class="rounded-lg bg-white p-6 shadow">
      <h2 class="mb-4 text-2xl font-semibold">導入真實賽事</h2>
      <p class="mb-4 text-gray-600">快速導入真實賽事資料來測試報名系統功能</p>
      <UButton
        label="導入114年永慶盃跆拳錦標賽"
        icon="i-heroicons-document-plus"
        color="purple"
        :loading="importingYongqingbei"
        @click="importYongqingbei"
      />
    </div>

    <!-- 現有測試賽事 -->
    <div v-if="existingGames.length > 0" class="rounded-lg bg-white p-6 shadow">
      <h2 class="mb-4 text-2xl font-semibold">現有測試賽事</h2>
      <div class="space-y-4">
        <div
          v-for="game in existingGames"
          :key="game.id"
          class="flex items-center justify-between rounded-lg border p-4"
        >
          <div>
            <h3 class="font-medium">{{ game.name }}</h3>
            <p class="text-sm text-gray-600">
              比賽日期：{{ formatDate(game.gameDate) }} | 報名截止：{{
                formatDate(game.signupEnd)
              }}
            </p>
            <p class="text-sm text-gray-600">
              地點：{{ game.location }} | 主辦：{{ game.organizer }}
            </p>
            <p
              v-if="game.gameCategories?.length"
              class="text-sm text-green-600"
            >
              已設定 {{ game.gameCategories.length }} 個競賽分類
            </p>
          </div>
          <div class="flex gap-2">
            <UButton :to="`/games/${game.id}/signup-new`" size="sm">
              前往報名
            </UButton>
            <UButton
              color="red"
              variant="outline"
              size="sm"
              @click="deleteGame(game.id)"
            >
              刪除
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- API 測試區 -->
    <div class="rounded-lg bg-gray-50 p-6">
      <h2 class="mb-4 text-2xl font-semibold">API 測試</h2>
      <div class="space-y-4">
        <div>
          <h3 class="mb-2 font-medium">測試用戶隊員 API</h3>
          <div class="flex gap-2">
            <UButton size="sm" @click="testUserPlayersAPI"
              >載入我的隊員</UButton
            >
            <UButton size="sm" @click="testTeamsAPI">載入我的隊伍</UButton>
            <UButton size="sm" @click="testTeamStaffAPI">載入隊職員</UButton>
          </div>
        </div>

        <div v-if="apiTestResult" class="rounded bg-white p-4 text-sm">
          <h4 class="mb-2 font-medium">API 測試結果：</h4>
          <pre class="overflow-auto">{{
            JSON.stringify(apiTestResult, null, 2)
          }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 類型定義
interface Game {
  id: string
  name: string
  description?: string
  gameDate: Date
  signupStart?: Date
  signupEnd?: Date
  location?: string
  organizer?: string
  status: string
  maxParticipants?: number
  rules?: string
  gameCategories?: Array<{
    id: string
    categoryName: string
    conditions?: string
  }>
  _count?: {
    registrations: number
  }
}

interface APITestResult {
  success: boolean
  message: string
  data?: unknown
}

// 驗證登入狀態
const { data: session } = await useSession()
if (!session.value) {
  navigateTo("/accounts/login")
}

// 狀態管理
const creating = ref(false)
const importingYongqingbei = ref(false)
const existingGames = ref<Game[]>([])
const apiTestResult = ref<APITestResult | null>(null)

// 測試賽事表單
const testGame = ref({
  name: "2024年度跆拳道錦標賽",
  gameDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0], // 30天後
  signupEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0], // 7天後
  location: "台北體育館",
  organizer: "中華民國跆拳道協會",
})

/**
 * Format date
 */
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("zh-TW")
}

/**
 * Create test game
 */
const createTestGame = async () => {
  creating.value = true
  try {
    const { data } = await $fetch("/api/games", {
      method: "POST",
      body: {
        ...testGame.value,
        gameDate: new Date(testGame.value.gameDate),
        signupStart: new Date(), // 立即開始報名
        signupEnd: new Date(testGame.value.signupEnd),
        description: "這是一個測試賽事，用於驗證新的報名系統功能。",
        rules: "請遵守比賽規則。",
        maxParticipants: 100,
        status: "upcoming",
      },
    })

    // 為測試賽事建立一些分類
    await createTestCategories(data.id)

    // 重新載入賽事列表
    await loadExistingGames()

    // 清空表單
    testGame.value.name = ""
  } catch (error) {
    console.error("建立測試賽事失敗:", error)
  } finally {
    creating.value = false
  }
}

/**
 * Create test categories for game
 */
const createTestCategories = async (gameId: string) => {
  const categories = [
    { categoryName: "國小男子品勢組", conditions: "限國小學生，男性" },
    { categoryName: "國小女子品勢組", conditions: "限國小學生，女性" },
    {
      categoryName: "國中男子對打組",
      conditions: "限國中學生，男性，體重60公斤以下",
    },
    {
      categoryName: "國中女子對打組",
      conditions: "限國中學生，女性，體重55公斤以下",
    },
    { categoryName: "高中混合組", conditions: "限高中學生，不分性別" },
    { categoryName: "成人黑帶組", conditions: "限18歲以上，黑帶一段以上" },
  ]

  for (const category of categories) {
    try {
      await $fetch("/api/game_category", {
        method: "POST",
        body: {
          gameId,
          ...category,
        },
      })
    } catch {
      // 忽略建立分類錯誤
    }
  }
}

/**
 * Import Yongqingbei tournament
 */
const importYongqingbei = async () => {
  importingYongqingbei.value = true
  try {
    // 永慶盃賽事資料
    const yongqingbeiData = {
      name: "114年永慶盃跆拳錦標賽",
      description: `
114年永慶盃跆拳錦標賽為推廣跆拳道運動，提供各級選手切磋技藝之機會，特舉辦此項賽事。
比賽項目包含品勢、對練、擊破三大項目，分為不同年齡組別與級別，歡迎各界選手踴躍參加。
      `.trim(),
      gameDate: new Date("2025-03-15"), // 假設比賽日期
      signupStart: new Date("2025-01-15"), // 假設報名開始
      signupEnd: new Date("2025-03-01"), // 假設報名截止
      location: "台北市立體育館",
      organizer: "永慶房屋",
      rules: `
比賽規則：
1. 品勢組：採用 WT 世界跆拳道聯盟指定品勢
2. 對練組：採用電子護具計分系統（公開組）
3. 擊破組：採用指定材料進行擊破測試
4. 各組別參賽資格請參照組別條件限制
5. 參賽選手需持有有效跆拳道段級證明
      `.trim(),
      maxParticipants: 1000,
      status: "upcoming",
    }

    // 建立賽事
    const { data: game } = await $fetch("/api/games", {
      method: "POST",
      body: yongqingbeiData,
    })

    // 永慶盃分類資料 (選擇主要分類)
    const categories = [
      // 品勢 - 個人品勢
      {
        categoryName: "幼幼組男女混合組（不分級）",
        conditions: "幼幼組，不分性別，不分級別",
      },
      {
        categoryName: "國小男子一般組（低年級）",
        conditions: "國小1-3年級，男性",
      },
      {
        categoryName: "國小男子一般組（高年級）",
        conditions: "國小4-6年級，男性",
      },
      {
        categoryName: "國小女子一般組（低年級）",
        conditions: "國小1-3年級，女性",
      },
      {
        categoryName: "國小女子一般組（高年級）",
        conditions: "國小4-6年級，女性",
      },
      {
        categoryName: "國中男子一般組",
        conditions: "國中生，男性",
      },
      {
        categoryName: "國中女子一般組",
        conditions: "國中生，女性",
      },
      {
        categoryName: "高中、大專、社會男子一般組",
        conditions: "高中以上，男性",
      },
      {
        categoryName: "高中、大專、社會女子一般組",
        conditions: "高中以上，女性",
      },

      // 對練
      {
        categoryName: "對練 幼稚園男子組",
        conditions: "幼稚園，男性，具8級以上",
      },
      {
        categoryName: "對練 幼稚園女子組",
        conditions: "幼稚園，女性，具8級以上",
      },
      {
        categoryName: "對練 國小男子色帶初級組",
        conditions: "國小生，男性，8至5級",
      },
      {
        categoryName: "對練 國小女子色帶初級組",
        conditions: "國小生，女性，8至5級",
      },
      {
        categoryName: "對練 國小男子黑帶組",
        conditions: "國小生，男性，1段以上",
      },
      {
        categoryName: "對練 國小女子黑帶組",
        conditions: "國小生，女性，1段以上",
      },
      {
        categoryName: "對練 國中男子一般組",
        conditions: "國中生，男性，8級至1級",
      },
      {
        categoryName: "對練 國中女子一般組",
        conditions: "國中生，女性，8級至1級",
      },

      // 擊破
      {
        categoryName: "擊破 低年級色帶男子組",
        conditions: "國小1-3年級，男性，色帶",
      },
      {
        categoryName: "擊破 低年級色帶女子組",
        conditions: "國小1-3年級，女性，色帶",
      },
      {
        categoryName: "擊破 國中黑帶男子組",
        conditions: "國中生，男性，黑帶",
      },
      {
        categoryName: "擊破 國中黑帶女子組",
        conditions: "國中生，女性，黑帶",
      },
    ]

    // 建立所有分類
    for (const category of categories) {
      try {
        await $fetch("/api/game_category", {
          method: "POST",
          body: {
            gameId: game.id,
            ...category,
          },
        })
      } catch {
        // 忽略建立分類錯誤
      }
    }

    // 重新載入賽事列表
    await loadExistingGames()

    alert(`成功導入114年永慶盃！共建立了 ${categories.length} 個競賽分類。`)
  } catch (error) {
    console.error("導入永慶盃失敗:", error)
    alert("導入失敗，請稍後再試。")
  } finally {
    importingYongqingbei.value = false
  }
}

/**
 * Load existing games
 */
const loadExistingGames = async () => {
  try {
    const { data } = await $fetch("/api/games")
    existingGames.value = data || []
  } catch (error) {
    console.error("載入賽事失敗:", error)
  }
}

/**
 * Delete game
 */
const deleteGame = async (gameId: string) => {
  try {
    await $fetch(`/api/games/${gameId}`, {
      method: "DELETE",
    })
    await loadExistingGames()
  } catch (error) {
    console.error("刪除賽事失敗:", error)
  }
}

/**
 * Test user players API
 */
const testUserPlayersAPI = async () => {
  try {
    const result = await $fetch("/api/user_player")
    apiTestResult.value = { api: "user_player", result }
  } catch (error: unknown) {
    apiTestResult.value = {
      api: "user_player",
      error: (error as Error).message,
    }
  }
}

/**
 * Test teams API
 */
const testTeamsAPI = async () => {
  try {
    const result = await $fetch("/api/team")
    apiTestResult.value = { api: "team", result }
  } catch (error: unknown) {
    apiTestResult.value = {
      api: "team",
      error: (error as Error).message,
    }
  }
}

/**
 * Test team staff API
 */
const testTeamStaffAPI = async () => {
  try {
    const result = await $fetch("/api/team_staff")
    apiTestResult.value = { api: "team_staff", result }
  } catch (error: unknown) {
    apiTestResult.value = {
      api: "team_staff",
      error: (error as Error).message,
    }
  }
}

// 初始載入
onMounted(() => {
  loadExistingGames()
})
</script>
