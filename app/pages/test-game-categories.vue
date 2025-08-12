<template>
  <div class="container mx-auto space-y-8 p-4">
    <h1 class="mb-6 text-3xl font-bold">賽事分類測試頁面</h1>

    <!-- 模擬賽事資訊 -->
    <div class="rounded-lg bg-white p-6 shadow">
      <h2 class="mb-4 text-2xl font-semibold">
        測試賽事：2024年度跆拳道錦標賽
      </h2>

      <!-- 賽事分類管理 -->
      <GameCategoryEditor
        :game-id="TEST_GAME_ID"
        :categories="categories"
        @category-added="onCategoryAdded"
        @category-updated="onCategoryUpdated"
        @category-deleted="onCategoryDeleted"
      />
    </div>

    <!-- 參賽者視角：分類選擇 -->
    <div v-if="categories.length > 0" class="rounded-lg bg-white p-6 shadow">
      <h2 class="mb-4 text-2xl font-semibold">參賽者視角：選擇參賽分類</h2>

      <SimpleCategorySelection
        :categories="categories"
        :available-user-players="userPlayers"
        :category-input-methods="categoryInputMethods"
        :selected-players="selectedPlayers"
        :manual-members="manualMembers"
        @update-input-method="updateInputMethod"
        @toggle-player-selection="togglePlayerSelection"
        @update-manual-members="updateManualMembers"
      />
    </div>

    <!-- 目前選擇狀況 -->
    <div v-if="categories.length > 0" class="rounded-lg bg-gray-50 p-6">
      <h3 class="mb-4 text-lg font-semibold">目前選擇狀況</h3>
      <pre class="text-sm">{{
        JSON.stringify(
          {
            categoryInputMethods,
            selectedPlayers,
            manualMembers,
          },
          null,
          2,
        )
      }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
const { data: session } = await useSession()

if (!session.value) {
  navigateTo("/accounts/login")
}

// 測試用的賽事 ID
const TEST_GAME_ID = "test-game-id"

// 賽事分類資料
const categories = ref<any[]>([])

// 載入分類資料
const loadCategories = async () => {
  try {
    const { data } = await $fetch(`/api/game_category?gameId=${TEST_GAME_ID}`)
    categories.value = data || []
  } catch (error) {
    console.error("載入分類失敗:", error)
  }
}

// 分類事件處理
const onCategoryAdded = (category: any) => {
  categories.value.push(category)
}

const onCategoryUpdated = (updatedCategory: any) => {
  const index = categories.value.findIndex((c) => c.id === updatedCategory.id)
  if (index !== -1) {
    categories.value[index] = updatedCategory
  }
}

const onCategoryDeleted = (categoryId: string) => {
  categories.value = categories.value.filter((c) => c.id !== categoryId)
}

// 模擬使用者隊員資料
const userPlayers = ref([
  {
    id: "player-1",
    name: "張小明",
    gender: "M" as const,
    birthday: "2008-05-15",
  },
  {
    id: "player-2",
    name: "李小美",
    gender: "F" as const,
    birthday: "2009-03-22",
  },
  {
    id: "player-3",
    name: "王大強",
    gender: "M" as const,
    birthday: "2007-12-10",
  },
])

// 分類選擇狀態
const categoryInputMethods = ref<Record<string, "user-players" | "manual">>({})
const selectedPlayers = ref<Record<string, string[]>>({})
const manualMembers = ref<Record<string, any[]>>({})

// 更新輸入方式
const updateInputMethod = (
  categoryId: string,
  method: "user-players" | "manual",
) => {
  categoryInputMethods.value[categoryId] = method

  // 清空其他方式的資料
  if (method === "user-players") {
    delete manualMembers.value[categoryId]
  } else {
    delete selectedPlayers.value[categoryId]
  }
}

// 切換隊員選擇
const togglePlayerSelection = (
  categoryId: string,
  playerId: string,
  selected: boolean,
) => {
  if (!selectedPlayers.value[categoryId]) {
    selectedPlayers.value[categoryId] = []
  }

  if (selected) {
    if (!selectedPlayers.value[categoryId].includes(playerId)) {
      selectedPlayers.value[categoryId].push(playerId)
    }
  } else {
    selectedPlayers.value[categoryId] = selectedPlayers.value[
      categoryId
    ].filter((id) => id !== playerId)
  }
}

// 更新手動隊員
const updateManualMembers = (categoryId: string, members: any[]) => {
  manualMembers.value[categoryId] = members
}

// 監聽分類變化，初始化選擇狀態
watchEffect(() => {
  categories.value.forEach((category) => {
    if (!(category.id in categoryInputMethods.value)) {
      categoryInputMethods.value[category.id] = "user-players"
    }
  })
})

// 初始載入
onMounted(() => {
  loadCategories()
})
</script>
