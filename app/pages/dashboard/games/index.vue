<script setup lang="ts">
import type { Game } from "~/types/game"

definePageMeta({
  layout: "dashboard",
})

interface GameWithExtras extends Game {
  game_detail?: {
    basis?: string
    note?: string
  }
  _count?: {
    registration: number
    game_category: number
  }
}

// 資料載入
const {
  data: games,
  pending,
  error,
  refresh,
} = await useFetch<GameWithExtras[]>("/api/games")

// 篩選和排序
const searchQuery = ref("")
const selectedRegion = ref("")
const selectedStatus = ref("")
const sortBy = ref("createdAt")
const sortOrder = ref<"asc" | "desc">("desc")

// 篩選收合狀態
const showFilters = ref(false)

// Modal 狀態
const isGameEditorOpen = ref(false)
const editingGame = ref<GameWithExtras | null>(null)

// 工具 composables
const { getGameStatus, getStatusText, getStatusColor } = useGameStatus()
const { formatDate } = useDateFormatter()
const { getRegionName, getRegionOptions } = useRegion()

// 篩選選項
const regionOptions = computed(() => [
  { label: "全部地區", value: "" },
  ...getRegionOptions(),
])

const statusOptions = [
  { label: "全部狀態", value: "" },
  { label: "即將開放報名", value: "upcoming" },
  { label: "報名進行中", value: "registration" },
  { label: "報名已截止", value: "closed" },
  { label: "賽事進行中", value: "ongoing" },
  { label: "賽事已結束", value: "ended" },
]

const sortOptions = [
  { label: "建立時間", value: "createdAt" },
  { label: "比賽日期", value: "gameStart" },
  { label: "報名截止", value: "signupEnd" },
  { label: "賽事名稱", value: "name" },
]

// 篩選後的賽事
const filteredGames = computed(() => {
  if (!games.value) return []

  let filtered = games.value

  // 搜尋篩選
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (game) =>
        game.name.toLowerCase().includes(query) ||
        game.venue.toLowerCase().includes(query) ||
        game.address.toLowerCase().includes(query),
    )
  }

  // 地區篩選
  if (selectedRegion.value) {
    filtered = filtered.filter((game) => game.region === selectedRegion.value)
  }

  // 狀態篩選
  if (selectedStatus.value) {
    filtered = filtered.filter((game) => {
      const status = getGameStatus(game)
      return status === selectedStatus.value
    })
  }

  // 排序
  return filtered.sort((a, b) => {
    const aValue = a[sortBy.value as keyof GameWithExtras]
    const bValue = b[sortBy.value as keyof GameWithExtras]

    if (sortBy.value === "name") {
      const result = String(aValue).localeCompare(String(bValue))
      return sortOrder.value === "asc" ? result : -result
    }

    const aDate = new Date(aValue as string)
    const bDate = new Date(bValue as string)
    const result = aDate.getTime() - bDate.getTime()
    return sortOrder.value === "asc" ? result : -result
  })
})

// 統計數據
const stats = computed(() => {
  if (!games.value)
    return { total: 0, upcoming: 0, registration: 0, ongoing: 0, ended: 0 }

  const counts = games.value.reduce(
    (acc, game) => {
      acc.total++
      const status = getGameStatus(game)
      acc[status]++
      return acc
    },
    {
      total: 0,
      upcoming: 0,
      registration: 0,
      closed: 0,
      ongoing: 0,
      ended: 0,
    },
  )

  return counts
})

// 操作函數
const handleCreateGame = () => {
  console.log("handleCreateGame called")
  editingGame.value = null

  // 使用 nextTick 確保狀態更新後再開啟模態框
  nextTick(() => {
    isGameEditorOpen.value = true
    console.log("isGameEditorOpen:", isGameEditorOpen.value)
  })
}

const handleEditGame = (game: GameWithExtras) => {
  console.log("handleEditGame called with:", game.name)
  editingGame.value = game
  isGameEditorOpen.value = true
  console.log("isGameEditorOpen:", isGameEditorOpen.value)
}

const handleDeleteGame = async (game: GameWithExtras) => {
  const toast = useToast()

  // 確認刪除
  const confirmed = confirm(
    `確定要刪除賽事「${game.name}」嗎？此操作無法復原。`,
  )
  if (!confirmed) return

  try {
    await $fetch(`/api/games/${game.id}`, {
      method: "DELETE",
    })

    toast.add({
      title: "刪除成功",
      description: `賽事「${game.name}」已成功刪除`,
      color: "green",
    })

    refresh()
  } catch {
    toast.add({
      title: "刪除失敗",
      description: "刪除賽事時發生錯誤\n",
      color: "red",
    })
  }
}

const handleGameSaved = () => {
  isGameEditorOpen.value = false
  editingGame.value = null
  refresh()
}

const handleRefresh = () => {
  refresh()
}

const clearFilters = () => {
  searchQuery.value = ""
  selectedRegion.value = ""
  selectedStatus.value = ""
  sortBy.value = "createdAt"
  sortOrder.value = "desc"
}

// 頁面標題
useSeoMeta({
  title: "賽事管理 - 後台管理",
})
</script>

<template>
  <div data-testid="games-dashboard">
    <UPageHeader
      title="賽事管理"
      description="管理所有跆拳道賽事，建立、編輯和監控賽事狀態"
      class="mb-6"
    >
      <template #links>
        <UButton
          icon="i-lucide-plus"
          data-testid="create-game-button"
          @click="handleCreateGame"
        >
          新增賽事
        </UButton>
      </template>
    </UPageHeader>

    <!-- 統計卡片 -->
    <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <UCard>
        <div class="flex items-center gap-3">
          <div class="bg-primary-100 dark:bg-primary-900 rounded-full p-2">
            <UIcon name="i-lucide-calendar" class="text-primary-600 h-5 w-5" />
          </div>
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">總賽事數</p>
            <p class="text-2xl font-bold">{{ stats.total }}</p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-3">
          <div class="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
            <UIcon name="i-lucide-clock" class="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">即將開放</p>
            <p class="text-2xl font-bold">{{ stats.upcoming }}</p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-3">
          <div class="rounded-full bg-green-100 p-2 dark:bg-green-900">
            <UIcon name="i-lucide-user-plus" class="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">報名中</p>
            <p class="text-2xl font-bold">{{ stats.registration }}</p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-3">
          <div class="rounded-full bg-yellow-100 p-2 dark:bg-yellow-900">
            <UIcon name="i-lucide-play" class="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">進行中</p>
            <p class="text-2xl font-bold">{{ stats.ongoing }}</p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-3">
          <div class="rounded-full bg-gray-100 p-2 dark:bg-gray-800">
            <UIcon name="i-lucide-check-circle" class="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">已結束</p>
            <p class="text-2xl font-bold">{{ stats.ended }}</p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- 篩選和搜尋 -->
    <UCard class="mb-6">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">篩選與搜尋</h3>
          <div class="flex gap-2">
            <UButton
              v-if="searchQuery || selectedRegion || selectedStatus"
              variant="ghost"
              size="sm"
              icon="i-lucide-filter-x"
              @click="clearFilters"
            >
              清除篩選
            </UButton>
            <UButton
              variant="ghost"
              size="sm"
              :icon="
                showFilters ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'
              "
              @click="showFilters = !showFilters"
            >
              {{ showFilters ? "收起" : "展開" }}
            </UButton>
            <UButton
              variant="ghost"
              size="sm"
              icon="i-lucide-refresh-cw"
              :loading="pending"
              @click="handleRefresh"
            >
              重新整理
            </UButton>
          </div>
        </div>
      </template>

      <div class="space-y-4">
        <!-- 搜尋列 -->
        <UFormField label="搜尋賽事">
          <UInput
            v-model="searchQuery"
            placeholder="搜尋賽事名稱、場地或地址..."
            icon="i-lucide-search"
          />
        </UFormField>

        <!-- 篩選選項 (可收合) -->
        <div
          v-show="showFilters"
          class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <UFormField label="地區">
            <USelect
              v-model="selectedRegion"
              :options="regionOptions"
              placeholder="選擇地區"
            />
          </UFormField>

          <UFormField label="狀態">
            <USelect
              v-model="selectedStatus"
              :options="statusOptions"
              placeholder="選擇狀態"
            />
          </UFormField>

          <UFormField label="排序">
            <USelect
              v-model="sortBy"
              :options="sortOptions"
              placeholder="排序欄位"
            />
          </UFormField>

          <UFormField label="順序">
            <USelectMenu
              v-model="sortOrder"
              :options="[
                { label: '遞減', value: 'desc' },
                { label: '遞增', value: 'asc' },
              ]"
            />
          </UFormField>
        </div>

        <!-- 結果統計 -->
        <div class="text-sm text-gray-600 dark:text-gray-400">
          共找到 {{ filteredGames.length }} 場賽事
          <span v-if="games && games.length !== filteredGames.length">
            （從 {{ games.length }} 場賽事中篩選）
          </span>
        </div>
      </div>
    </UCard>

    <!-- 載入狀態 -->
    <div v-if="pending" class="space-y-4">
      <USkeleton v-for="i in 5" :key="i" class="h-20 w-full" />
    </div>

    <!-- 錯誤狀態 -->
    <EmptyState
      v-else-if="error"
      icon="i-lucide-triangle-alert"
      title="載入賽事資料時發生錯誤"
      :description="error.message"
      action-text="重新載入"
      action-color="error"
      @action="handleRefresh"
    />

    <!-- 無資料狀態 -->
    <EmptyState
      v-else-if="
        !filteredGames.length &&
        !searchQuery &&
        !selectedRegion &&
        !selectedStatus
      "
      icon="i-lucide-calendar-x"
      title="尚未建立任何賽事"
      description="開始建立您的第一場賽事"
      action-text="新增賽事"
      @action="handleCreateGame"
    />

    <!-- 篩選後無結果 -->
    <EmptyState
      v-else-if="!filteredGames.length"
      icon="i-lucide-search-x"
      title="沒有符合條件的賽事"
      description="嘗試調整篩選條件或清除所有篩選"
      action-text="清除篩選"
      @action="clearFilters"
    />

    <!-- 賽事列表 -->
    <UCard v-else>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <th
                class="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400"
              >
                賽事資訊
              </th>
              <th
                class="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400"
              >
                地區/場地
              </th>
              <th
                class="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400"
              >
                時間
              </th>
              <th
                class="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400"
              >
                狀態
              </th>
              <th
                class="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400"
              >
                報名數
              </th>
              <th
                class="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400"
              >
                操作
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="game in filteredGames"
              :key="game.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <!-- 賽事資訊 -->
              <td class="px-4 py-4">
                <div class="space-y-1">
                  <p class="font-semibold text-gray-900 dark:text-gray-100">
                    {{ game.name }}
                  </p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ formatDate(game.createdAt) }} 建立
                  </p>
                </div>
              </td>

              <!-- 地區/場地 -->
              <td class="px-4 py-4">
                <div class="space-y-1">
                  <p class="font-medium text-gray-900 dark:text-gray-100">
                    {{ game.venue }}
                  </p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ getRegionName(game.region) }}
                  </p>
                </div>
              </td>

              <!-- 時間 -->
              <td class="px-4 py-4">
                <div class="space-y-1">
                  <p class="text-sm text-gray-900 dark:text-gray-100">
                    報名：{{ formatDate(game.signupStart) }} ~
                    {{ formatDate(game.signupEnd) }}
                  </p>
                  <p class="text-sm text-gray-900 dark:text-gray-100">
                    賽事：{{ formatDate(game.gameStart) }} ~
                    {{ formatDate(game.gameEnd) }}
                  </p>
                </div>
              </td>

              <!-- 狀態 -->
              <td class="px-4 py-4">
                <UBadge
                  :color="getStatusColor(getGameStatus(game))"
                  variant="subtle"
                >
                  {{ getStatusText(getGameStatus(game)) }}
                </UBadge>
              </td>

              <!-- 報名數 -->
              <td class="px-4 py-4">
                <div class="flex items-center gap-1">
                  <UIcon name="i-lucide-users" class="h-4 w-4 text-gray-500" />
                  <span class="text-sm font-medium">
                    {{ game._count?.registration || 0 }}
                  </span>
                </div>
              </td>

              <!-- 操作 -->
              <td class="px-4 py-4 text-right">
                <div class="flex justify-end gap-2">
                  <UTooltip text="查看報名狀況">
                    <UButton
                      variant="ghost"
                      size="sm"
                      icon="i-lucide-eye"
                      :to="`/dashboard/games/${game.id}`"
                    />
                  </UTooltip>
                  <UTooltip text="編輯賽事">
                    <UButton
                      variant="ghost"
                      size="sm"
                      icon="i-lucide-edit"
                      @click="handleEditGame(game)"
                    />
                  </UTooltip>
                  <UTooltip text="刪除賽事">
                    <UButton
                      variant="ghost"
                      size="sm"
                      icon="i-lucide-trash"
                      color="red"
                      @click="handleDeleteGame(game)"
                    />
                  </UTooltip>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- 賽事編輯器 Modal -->
    <GameEditor
      v-model="isGameEditorOpen"
      :game="editingGame"
      @saved="handleGameSaved"
    />
  </div>
</template>
