<script setup lang="ts">
definePageMeta({
  layout: "dashboard",
})

interface GameCategory {
  id: string
  gameId: string
  type: string
  group: string
  level?: string
  weightClass?: string
  fullName: string
  _count: {
    registration: number
  }
  registration?: {
    id: string
    status?: string
    createdAt: string
    user: {
      name: string
      email?: string
      phone?: string
    }
    team: {
      name: string
      team_member?: Array<{ id: string; name: string }>
    }
  }[]
}

interface GameWithDetails {
  id: string
  name: string
  region: string
  venue: string
  address: string
  signupStart: string
  signupEnd: string
  gameStart: string
  gameEnd: string
  createdAt: string
  updatedAt: string
  game_category?: GameCategory[]
  game_detail?: {
    basis?: string
    note?: string
  }
}

const route = useRoute()
const gameId = route.params.id as string

// 獲取賽事詳情
const {
  data: game,
  pending: gamePending,
  error: gameError,
  refresh: refreshGame,
} = await useFetch<GameWithDetails>("/api/games", {
  query: { id: gameId },
})

// 獲取賽事分類
const {
  data: categories,
  pending: categoriesPending,
  error: categoriesError,
  refresh: refreshCategories,
} = await useFetch<GameCategory[]>("/api/game_category", {
  query: { gameId },
})

// 分頁狀態 - 使用字串值而不是索引
const selectedTab = ref("categories")

// 調試用：檢查載入的資料
watch(
  categories,
  (newCategories) => {
    if (newCategories) {
      console.log("載入的分類資料:", newCategories)
      newCategories.forEach((cat, index) => {
        console.log(`分類 ${index + 1}:`, {
          fullName: cat.fullName,
          registrationCount: cat._count?.registration,
          actualRegistrations: cat.registration?.length || 0,
          registrations: cat.registration,
        })
      })
    }
  },
  { immediate: true },
)

// Modal 狀態
const isCategoryEditorOpen = ref(false)
const editingCategory = ref<GameCategory | null>(null)

// 表單資料 - 新版格式
const categoryForm = ref({
  type: "",
  ageGroup: "", // 組別 (原 group)
  gender: "", // 性別 (原 level)
  weightClass: "",
  fullName: "",
})

// 表單驗證狀態
const isCategorySubmitting = ref(false)

// 選項 - 新版格式
const typeOptions = [
  { label: "品勢", value: "品勢" },
  { label: "對打", value: "對打" },
  // 未來可能會擴充其他類型
  // { label: "威力擊破", value: "威力擊破" },
  // { label: "特技", value: "特技" },
]

// 組別形式選項（根據競賽類型動態顯示）
const getGenderOptions = (type: string) => {
  if (type === "品勢") {
    return [
      { label: "個人", value: "個人" },
      { label: "雙人", value: "雙人" },
      { label: "團體", value: "團體" },
    ]
  }
  if (type === "對打") {
    return [
      { label: "個人", value: "個人" },
      { label: "團體", value: "團體" },
    ]
  }
  // 預設情況
  return [{ label: "個人", value: "個人" }]
}

// 自動生成全名 - 新版格式
watch(
  [
    () => categoryForm.value.type,
    () => categoryForm.value.ageGroup,
    () => categoryForm.value.gender,
    () => categoryForm.value.weightClass,
  ],
  () => {
    const parts = []

    // 根據競賽類型決定命名格式
    if (categoryForm.value.type === "品勢") {
      // 品勢：組別 + 性別
      // 例如：高中男子個人、社會女子團體、國小雙人
      parts.push(categoryForm.value.ageGroup, categoryForm.value.gender)
    } else if (categoryForm.value.type === "對打") {
      // 對打：組別 + 量級
      // 例如：青少年男子組45公斤級、國中女子組50公斤級
      if (categoryForm.value.weightClass) {
        parts.push(categoryForm.value.ageGroup, categoryForm.value.weightClass)
      } else {
        parts.push(categoryForm.value.ageGroup, categoryForm.value.gender)
      }
    } else {
      // 其他競賽類型：組別 + 性別
      parts.push(categoryForm.value.ageGroup, categoryForm.value.gender)
    }

    categoryForm.value.fullName = parts.filter(Boolean).join("")
  },
)

// 表單驗證 - 新版格式
const isCategoryFormValid = computed(() => {
  return (
    categoryForm.value.type.trim() &&
    categoryForm.value.ageGroup.trim() &&
    categoryForm.value.gender.trim() &&
    categoryForm.value.fullName.trim()
  )
})

const tabs = [
  {
    label: "賽事分類",
    icon: "i-lucide-list",
    value: "categories",
  },
  {
    label: "報名管理",
    icon: "i-lucide-users",
    value: "registrations",
  },
  {
    label: "賽事設定",
    icon: "i-lucide-settings",
    value: "settings",
  },
]

// 工具 composables
const { getGameStatus, getStatusText } = useGameStatus()
const { formatDate } = useDateFormatter()

// 統計數據
const stats = computed(() => {
  if (!categories.value) return { totalCategories: 0, totalRegistrations: 0 }

  const totalCategories = categories.value.length
  const totalRegistrations = categories.value.reduce(
    (sum, cat) => sum + (cat._count?.registration || 0),
    0,
  )

  return { totalCategories, totalRegistrations }
})

// 報名統計
const totalRegistrations = computed(() => {
  if (!categories.value) return 0
  return categories.value.reduce(
    (sum, cat) => sum + (cat.registration?.length || 0),
    0,
  )
})

const _confirmedRegistrations = computed(() => {
  if (!categories.value) return 0
  return categories.value.reduce((sum, cat) => {
    return (
      sum +
      (cat.registration?.filter((reg) => reg.status === "confirmed")?.length ||
        0)
    )
  }, 0)
})

const _pendingRegistrations = computed(() => {
  if (!categories.value) return 0
  return categories.value.reduce((sum, cat) => {
    return (
      sum +
      (cat.registration?.filter((reg) => reg.status === "pending")?.length || 0)
    )
  }, 0)
})

const activeCategories = computed(() => {
  if (!categories.value) return 0
  return categories.value.filter(
    (cat) => cat.registration && cat.registration.length > 0,
  ).length
})

const categoriesWithRegistrations = computed(() => {
  if (!categories.value) return []
  return categories.value.filter(
    (cat) => cat.registration && cat.registration.length > 0,
  )
})

// 報名狀態相關函數
const _getRegistrationStatusText = (status?: string) => {
  switch (status) {
    case "confirmed":
      return "已確認"
    case "pending":
      return "待審核"
    case "cancelled":
      return "已取消"
    default:
      return "待審核"
  }
}

const _getRegistrationStatusColor = (status?: string) => {
  switch (status) {
    case "confirmed":
      return "green"
    case "pending":
      return "amber"
    case "cancelled":
      return "red"
    default:
      return "gray"
  }
}

// 報名管理函數
const _exportRegistrations = async () => {
  const toast = useToast()
  try {
    // 這裡可以實現匯出功能
    toast.add({
      title: "功能開發中",
      description: "匯出功能正在開發中",
      color: "amber",
    })
  } catch {
    toast.add({
      title: "匯出失敗",
      description: "匯出報名資料時發生錯誤",
      color: "red",
    })
  }
}

// 定義報名類型
interface Registration {
  id: string
  status?: string
  createdAt: string
  user: {
    name: string
    email?: string
    phone?: string
  }
  team: {
    name: string
    team_member?: Array<{ id: string; name: string }>
  }
}

const _viewRegistrationDetail = (registration: Registration) => {
  // 這裡可以實現查看詳情功能
  console.log("查看報名詳情:", registration)
}

const _editRegistrationStatus = (registration: Registration) => {
  // 這裡可以實現編輯狀態功能
  console.log("編輯報名狀態:", registration)
}

const _deleteRegistration = async (registration: Registration) => {
  const toast = useToast()
  const confirmed = confirm(`確定要刪除此報名嗎？`)
  if (!confirmed) return

  try {
    // 使用正確的類型
    const response = await fetch(`/api/registration/${registration.id}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      throw new Error("刪除失敗")
    }

    toast.add({
      title: "刪除成功",
      description: "報名資料已成功刪除",
      color: "green",
    })

    refreshCategories()
  } catch {
    toast.add({
      title: "刪除失敗",
      description: "刪除報名資料時發生錯誤",
      color: "red",
    })
  }
}

const handleRefreshCategories = () => {
  refreshCategories()
}

// 賽事設定表單
const settingsForm = ref({
  name: "",
  region: "",
  venue: "",
  address: "",
  signupStart: "",
  signupEnd: "",
  gameStart: "",
  gameEnd: "",
  basis: "",
  note: "",
})

const isSettingsSubmitting = ref(false)

// 設定表單驗證
const isSettingsFormValid = computed(() => {
  return (
    settingsForm.value.name.trim() &&
    settingsForm.value.region &&
    settingsForm.value.venue.trim() &&
    settingsForm.value.address.trim() &&
    settingsForm.value.signupStart &&
    settingsForm.value.signupEnd &&
    settingsForm.value.gameStart &&
    settingsForm.value.gameEnd
  )
})

// 地區選項
const { getRegionOptions } = useRegion()
const regionOptions = computed(() => [
  { label: "選擇地區", value: null, disabled: true },
  ...getRegionOptions(),
])

// 格式化日期時間為 datetime-local 格式
const formatDateTimeLocal = (dateString: string) => {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

// 初始化設定表單
watch(
  game,
  (newGame) => {
    if (newGame) {
      settingsForm.value = {
        name: newGame.name || "",
        region: newGame.region || "",
        venue: newGame.venue || "",
        address: newGame.address || "",
        signupStart: newGame.signupStart
          ? formatDateTimeLocal(newGame.signupStart)
          : "",
        signupEnd: newGame.signupEnd
          ? formatDateTimeLocal(newGame.signupEnd)
          : "",
        gameStart: newGame.gameStart
          ? formatDateTimeLocal(newGame.gameStart)
          : "",
        gameEnd: newGame.gameEnd ? formatDateTimeLocal(newGame.gameEnd) : "",
        basis: newGame.game_detail?.basis || "",
        note: newGame.game_detail?.note || "",
      }
    }
  },
  { immediate: true },
)

// 處理設定提交
const handleSettingsSubmit = async () => {
  if (!isSettingsFormValid.value || isSettingsSubmitting.value || !game.value)
    return

  isSettingsSubmitting.value = true
  const toast = useToast()

  try {
    // 更新賽事基本資訊和詳情
    await $fetch(`/api/games/${game.value.id}`, {
      method: "PUT",
      body: {
        name: settingsForm.value.name,
        region: settingsForm.value.region,
        venue: settingsForm.value.venue,
        address: settingsForm.value.address,
        signupStart: settingsForm.value.signupStart,
        signupEnd: settingsForm.value.signupEnd,
        gameStart: settingsForm.value.gameStart,
        gameEnd: settingsForm.value.gameEnd,
        basis: settingsForm.value.basis || null,
        note: settingsForm.value.note || null,
      },
    })

    toast.add({
      title: "儲存成功",
      description: "賽事設定已成功更新",
      color: "green",
    })

    // 重新載入資料
    await refreshGame()
  } catch (error) {
    console.error("儲存設定失敗:", error)
    toast.add({
      title: "儲存失敗",
      description: "儲存賽事設定時發生錯誤",
      color: "red",
    })
  } finally {
    isSettingsSubmitting.value = false
  }
}

// 處理刪除賽事
const handleDeleteGame = async () => {
  if (!game.value) return

  const toast = useToast()
  const confirmed = confirm(
    `確定要刪除賽事「${game.value.name}」嗎？此操作無法復原，將會刪除所有相關資料。`,
  )
  if (!confirmed) return

  try {
    await $fetch(`/api/games/${game.value.id}`, {
      method: "DELETE",
    })

    toast.add({
      title: "刪除成功",
      description: "賽事已成功刪除",
      color: "green",
    })

    // 導航回賽事列表
    navigateTo("/dashboard/games")
  } catch {
    toast.add({
      title: "刪除失敗",
      description: "刪除賽事時發生錯誤",
      color: "red",
    })
  }
}

// 賽事狀態工具函數
const getStatusColor = (status: string) => {
  switch (status) {
    case "upcoming":
      return "blue"
    case "registration":
      return "green"
    case "closed":
      return "orange"
    case "ongoing":
      return "purple"
    case "ended":
      return "gray"
    default:
      return "gray"
  }
}

// 操作函數
const handleCreateCategory = () => {
  editingCategory.value = null
  // 重置表單 - 新版格式
  categoryForm.value = {
    type: "",
    ageGroup: "",
    gender: "",
    weightClass: "",
    fullName: "",
  }
  isCategoryEditorOpen.value = true
}

const handleEditCategory = (category: GameCategory) => {
  editingCategory.value = category
  // 填入編輯資料 - 新版格式
  categoryForm.value = {
    type: category.type,
    ageGroup: category.group, // 資料庫的 group 對應新版的 ageGroup
    gender: category.level || "", // 資料庫的 level 對應新版的 gender
    weightClass: category.weightClass || "",
    fullName: category.fullName,
  }
  isCategoryEditorOpen.value = true
}

const handleDeleteCategory = async (category: GameCategory) => {
  const toast = useToast()

  // 檢查是否有報名
  if (category._count.registration > 0) {
    toast.add({
      title: "無法刪除",
      description: "此分類已有報名資料，無法刪除",
      color: "red",
    })
    return
  }

  const confirmed = confirm(`確定要刪除分類「${category.fullName}」嗎？`)
  if (!confirmed) return

  try {
    await $fetch(`/api/game_category/${category.id}`, {
      method: "DELETE",
    })

    toast.add({
      title: "刪除成功",
      description: `分類「${category.fullName}」已成功刪除`,
      color: "green",
    })

    refreshCategories()
  } catch {
    toast.add({
      title: "刪除失敗",
      description: "刪除分類時發生錯誤",
      color: "red",
    })
  }
}

const handleCategorySubmit = async () => {
  if (!isCategoryFormValid.value || isCategorySubmitting.value) return

  isCategorySubmitting.value = true

  try {
    if (editingCategory.value) {
      // 編輯現有分類 - 新版格式
      await $fetch(`/api/game_category/${editingCategory.value.id}`, {
        method: "PUT",
        body: {
          gameId: gameId,
          type: categoryForm.value.type,
          group: categoryForm.value.ageGroup, // 新版的 ageGroup 對應資料庫的 group
          level: categoryForm.value.gender || null, // 新版的 gender 對應資料庫的 level
          weightClass: categoryForm.value.weightClass || null,
          fullName: categoryForm.value.fullName,
        },
      })
    } else {
      // 新增分類 - 新版格式
      await $fetch("/api/game_category", {
        method: "POST",
        body: {
          gameId: gameId,
          type: categoryForm.value.type,
          group: categoryForm.value.ageGroup, // 新版的 ageGroup 對應資料庫的 group
          level: categoryForm.value.gender || null, // 新版的 gender 對應資料庫的 level
          weightClass: categoryForm.value.weightClass || null,
          fullName: categoryForm.value.fullName,
        },
      })
    }

    await refreshGame()
    await refreshCategories()
    isCategoryEditorOpen.value = false
  } catch (error) {
    console.error("分類操作失敗:", error)
  } finally {
    isCategorySubmitting.value = false
  }
}

// 頁面標題
useSeoMeta({
  title: `${game.value?.name || "賽事"} - 管理後台`,
})
</script>

<template>
  <div>
    <!-- 載入狀態 -->
    <div
      v-if="gamePending"
      class="flex min-h-[400px] items-center justify-center"
    >
      <div class="text-center">
        <UIcon
          name="i-lucide-loader-2"
          class="text-primary mx-auto mb-4 h-8 w-8 animate-spin"
        />
        <p>載入中...</p>
      </div>
    </div>

    <!-- 錯誤狀態 -->
    <EmptyState
      v-else-if="gameError"
      icon="i-lucide-triangle-alert"
      title="載入賽事資料時發生錯誤"
      action-text="重新載入"
      action-color="error"
      @action="refreshGame"
    />

    <!-- 主要內容 -->
    <div v-else-if="game" class="space-y-6">
      <!-- 頁面標題 -->
      <UPageHeader
        :title="`管理：${game.name}`"
        :description="`${game.venue} - ${formatDate(game.gameStart)}`"
      >
        <template #links>
          <UButton
            variant="outline"
            icon="i-lucide-eye"
            :to="`/games/${game.id}`"
            target="_blank"
          >
            查看前台
          </UButton>
          <UButton variant="outline" icon="i-lucide-edit" to="/dashboard/games">
            返回賽事列表
          </UButton>
        </template>
      </UPageHeader>

      <!-- 賽事狀態卡片 -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <UCard>
          <div class="flex items-center gap-3">
            <div class="rounded-lg bg-blue-100 p-2 dark:bg-blue-900">
              <UIcon name="i-lucide-list" class="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">賽事分類</p>
              <p class="text-2xl font-bold">{{ stats.totalCategories }}</p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-3">
            <div class="rounded-lg bg-green-100 p-2 dark:bg-green-900">
              <UIcon name="i-lucide-users" class="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">總報名數</p>
              <p class="text-2xl font-bold">{{ stats.totalRegistrations }}</p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-3">
            <div class="rounded-lg bg-amber-100 p-2 dark:bg-amber-900">
              <UIcon name="i-lucide-calendar" class="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">賽事狀態</p>
              <p class="text-sm font-bold">
                {{ getStatusText(getGameStatus(game as any)) }}
              </p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-3">
            <div class="rounded-lg bg-purple-100 p-2 dark:bg-purple-900">
              <UIcon name="i-lucide-map-pin" class="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">場地</p>
              <p class="text-sm font-bold">{{ game.venue }}</p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- 標籤頁 -->
      <UTabs
        v-model="selectedTab"
        :items="tabs"
        :content="false"
        class="w-full"
      />

      <!-- 標籤頁內容 -->
      <div class="mt-6">
        <!-- 賽事分類管理 -->
        <div v-if="selectedTab === 'categories'" class="space-y-6">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">賽事分類管理</h3>
            <UButton icon="i-lucide-plus" @click="handleCreateCategory">
              新增分類
            </UButton>
          </div>

          <!-- 載入狀態 -->
          <div v-if="categoriesPending" class="space-y-4">
            <USkeleton v-for="i in 3" :key="i" class="h-16 w-full" />
          </div>

          <!-- 錯誤狀態 -->
          <EmptyState
            v-else-if="categoriesError"
            icon="i-lucide-triangle-alert"
            title="載入分類資料時發生錯誤"
            action-text="重新載入"
            action-color="error"
            @action="refreshCategories"
          />

          <!-- 無分類狀態 -->
          <EmptyState
            v-else-if="!categories || categories.length === 0"
            icon="i-lucide-list-x"
            title="尚未建立任何分類"
            description="開始建立您的第一個賽事分類"
            action-text="新增分類"
            @action="handleCreateCategory"
          />

          <!-- 分類列表 -->
          <UCard v-else>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th
                      class="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400"
                    >
                      分類名稱
                    </th>
                    <th
                      class="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400"
                    >
                      類型 / 組別
                    </th>
                    <th
                      class="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400"
                    >
                      級別 / 重量
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
                    v-for="category in categories"
                    :key="category.id"
                    class="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td class="px-4 py-4">
                      <div class="font-medium text-gray-900 dark:text-gray-100">
                        {{ category.fullName }}
                      </div>
                    </td>
                    <td class="px-4 py-4">
                      <div class="space-y-1">
                        <div class="text-sm font-medium">
                          {{ category.type }}
                        </div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">
                          {{ category.group }}
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-4">
                      <div class="space-y-1">
                        <div
                          v-if="category.level"
                          class="text-sm text-gray-900 dark:text-gray-100"
                        >
                          {{ category.level }}
                        </div>
                        <div
                          v-if="category.weightClass"
                          class="text-sm text-gray-600 dark:text-gray-400"
                        >
                          {{ category.weightClass }}
                        </div>
                        <div
                          v-if="!category.level && !category.weightClass"
                          class="text-sm text-gray-400"
                        >
                          無限制
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-4">
                      <div class="flex items-center gap-1">
                        <UIcon
                          name="i-lucide-users"
                          class="h-4 w-4 text-gray-500"
                        />
                        <span class="text-sm font-medium">
                          {{ category._count.registration }}
                        </span>
                      </div>
                    </td>
                    <td class="px-4 py-4 text-right">
                      <div class="flex justify-end gap-2">
                        <UTooltip text="編輯分類">
                          <UButton
                            variant="ghost"
                            size="sm"
                            icon="i-lucide-edit"
                            @click="handleEditCategory(category)"
                          />
                        </UTooltip>
                        <UTooltip text="刪除分類">
                          <UButton
                            variant="ghost"
                            size="sm"
                            icon="i-lucide-trash"
                            color="red"
                            :disabled="category._count.registration > 0"
                            @click="handleDeleteCategory(category)"
                          />
                        </UTooltip>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </UCard>
        </div>

        <!-- 報名管理 -->
        <div v-else-if="selectedTab === 'registrations'" class="space-y-6">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">報名管理</h3>
            <UButton
              variant="outline"
              size="sm"
              icon="i-lucide-refresh-cw"
              :loading="categoriesPending"
              @click="handleRefreshCategories"
            >
              重新整理
            </UButton>
            <div class="flex gap-2">
              <UButton
                color="primary"
                variant="soft"
                icon="i-lucide-eye"
                :to="`/dashboard/games/${gameId}/registrations`"
              >
                查看審核
              </UButton>
            </div>
          </div>

          <!-- 報名統計概覽 -->
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <UCard>
              <div class="flex items-center gap-3">
                <div class="rounded-lg bg-blue-100 p-2 dark:bg-blue-900">
                  <UIcon name="i-lucide-users" class="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    總報名數
                  </p>
                  <p class="text-2xl font-bold">{{ totalRegistrations }}</p>
                </div>
              </div>
            </UCard>

            <UCard>
              <div class="flex items-center gap-3">
                <div class="rounded-lg bg-purple-100 p-2 dark:bg-purple-900">
                  <UIcon
                    name="i-lucide-shield"
                    class="h-5 w-5 text-purple-600"
                  />
                </div>
                <div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    參賽組別
                  </p>
                  <p class="text-2xl font-bold">{{ activeCategories }}</p>
                </div>
              </div>
            </UCard>

            <UCard>
              <div class="flex items-center gap-3">
                <div class="rounded-lg bg-green-100 p-2 dark:bg-green-900">
                  <UIcon
                    name="i-lucide-check-circle"
                    class="h-5 w-5 text-green-600"
                  />
                </div>
                <div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    已報名分類
                  </p>
                  <p class="text-2xl font-bold">
                    {{ categoriesWithRegistrations.length }}
                  </p>
                </div>
              </div>
            </UCard>
          </div>

          <!-- 依分類顯示報名資料 -->
          <div
            v-if="!categories || categories.length === 0"
            class="py-8 text-center"
          >
            <UIcon
              name="i-lucide-inbox"
              class="mx-auto mb-4 h-12 w-12 text-gray-400"
            />
            <h3
              class="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100"
            >
              尚無賽事分類
            </h3>
            <p class="text-gray-600 dark:text-gray-400">
              請先建立賽事分類才能接受報名
            </p>
          </div>

          <div v-else class="space-y-6">
            <div
              v-for="category in categories"
              :key="category.id"
              class="space-y-4"
            >
              <div class="flex items-center justify-between">
                <h4 class="text-lg font-semibold">
                  {{ category.fullName }}
                  <UBadge variant="soft" class="ml-2">
                    {{ category.registration?.length || 0 }} 人
                  </UBadge>
                </h4>
              </div>

              <UCard v-if="category.registration?.length">
                <div class="space-y-4">
                  <div
                    v-for="registration in category.registration"
                    :key="registration.id"
                    class="flex items-center justify-between border-b border-gray-200 pb-4 last:border-b-0 dark:border-gray-700"
                  >
                    <div class="flex-1">
                      <div class="font-medium text-gray-900 dark:text-gray-100">
                        {{
                          registration.team?.team_member
                            ?.map((m) => m.name)
                            .join("、") || "—"
                        }}
                      </div>
                      <div
                        v-if="registration.team?.name"
                        class="text-sm text-gray-600 dark:text-gray-400"
                      >
                        所屬單位：{{ registration.team.name }}
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="text-sm text-gray-900 dark:text-gray-100">
                        {{ formatDate(registration.createdAt) }}
                      </div>
                      <div class="text-sm text-gray-600 dark:text-gray-400">
                        {{ registration.user?.email }}
                      </div>
                    </div>
                  </div>
                </div>
              </UCard>

              <UCard v-else>
                <div class="py-8 text-center">
                  <UIcon
                    name="i-lucide-user-x"
                    class="mx-auto mb-4 h-8 w-8 text-gray-400"
                  />
                  <p class="text-gray-600 dark:text-gray-400">
                    此分類尚無報名資料
                  </p>
                </div>
              </UCard>
            </div>
          </div>
        </div>

        <!-- 賽事設定 -->
        <div v-else-if="selectedTab === 'settings'" class="space-y-6">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">賽事設定</h3>
            <UButton
              variant="outline"
              size="sm"
              icon="i-lucide-save"
              :loading="isSettingsSubmitting"
              :disabled="!isSettingsFormValid"
              @click="handleSettingsSubmit"
            >
              儲存設定
            </UButton>
          </div>

          <!-- 基本賽事資訊 -->
          <UCard>
            <template #header>
              <h4 class="text-lg font-semibold">基本資訊</h4>
            </template>
            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField label="賽事名稱" required>
                <UInput
                  v-model="settingsForm.name"
                  placeholder="輸入賽事名稱"
                  required
                />
              </UFormField>

              <UFormField label="地區" required>
                <USelect
                  v-model="settingsForm.region"
                  :items="regionOptions"
                  placeholder="選擇地區"
                  required
                />
              </UFormField>

              <UFormField label="比賽場地" required>
                <UInput
                  v-model="settingsForm.venue"
                  placeholder="輸入比賽場地"
                  required
                />
              </UFormField>

              <UFormField label="詳細地址" required>
                <UInput
                  v-model="settingsForm.address"
                  placeholder="輸入詳細地址"
                  required
                />
              </UFormField>
            </div>
          </UCard>

          <!-- 時間設定 -->
          <UCard>
            <template #header>
              <h4 class="text-lg font-semibold">時間設定</h4>
            </template>
            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField label="報名開始時間" required>
                <UInput
                  v-model="settingsForm.signupStart"
                  type="datetime-local"
                  required
                />
              </UFormField>

              <UFormField label="報名截止時間" required>
                <UInput
                  v-model="settingsForm.signupEnd"
                  type="datetime-local"
                  required
                />
              </UFormField>

              <UFormField label="比賽開始時間" required>
                <UInput
                  v-model="settingsForm.gameStart"
                  type="datetime-local"
                  required
                />
              </UFormField>

              <UFormField label="比賽結束時間" required>
                <UInput
                  v-model="settingsForm.gameEnd"
                  type="datetime-local"
                  required
                />
              </UFormField>
            </div>
          </UCard>

          <!-- 賽事說明 -->
          <UCard>
            <template #header>
              <h4 class="text-lg font-semibold">賽事說明</h4>
            </template>
            <div class="space-y-4">
              <UFormField label="賽事依據">
                <UTextarea
                  v-model="settingsForm.basis"
                  placeholder="輸入賽事依據（如：中華民國跆拳道協會主辦）"
                  :rows="3"
                />
              </UFormField>

              <UFormField label="備註說明">
                <UTextarea
                  v-model="settingsForm.note"
                  placeholder="輸入其他備註說明"
                  :rows="3"
                />
              </UFormField>
            </div>
          </UCard>

          <!-- 賽事狀態預覽 -->
          <UCard>
            <template #header>
              <h4 class="text-lg font-semibold">狀態預覽</h4>
            </template>
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div class="text-center">
                <div class="mb-2">
                  <UBadge
                    :color="getStatusColor(getGameStatus(settingsForm as any))"
                    variant="soft"
                    size="lg"
                  >
                    {{ getStatusText(getGameStatus(settingsForm as any)) }}
                  </UBadge>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400">當前狀態</p>
              </div>

              <div class="text-center">
                <div class="mb-2 text-lg font-bold">
                  {{ stats.totalCategories }}
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400">賽事分類</p>
              </div>

              <div class="text-center">
                <div class="mb-2 text-lg font-bold">
                  {{ totalRegistrations }}
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400">總報名數</p>
              </div>

              <div class="text-center">
                <div class="mb-2 text-lg font-bold">
                  {{ activeCategories }}
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  已報名分類
                </p>
              </div>
            </div>
          </UCard>

          <!-- 危險操作區域 -->
          <UCard>
            <template #header>
              <h4 class="text-lg font-semibold text-red-600">危險操作</h4>
            </template>
            <div class="space-y-4">
              <div
                class="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950"
              >
                <div class="flex items-start gap-3">
                  <UIcon
                    name="i-lucide-triangle-alert"
                    class="h-5 w-5 text-red-600 dark:text-red-400"
                  />
                  <div class="flex-1">
                    <h5 class="font-medium text-red-800 dark:text-red-200">
                      刪除賽事
                    </h5>
                    <p class="mt-1 text-sm text-red-700 dark:text-red-300">
                      刪除賽事將會移除所有相關資料，包括分類、報名記錄等，此操作無法復原。
                    </p>
                    <UButton
                      color="red"
                      variant="solid"
                      size="sm"
                      class="mt-3"
                      @click="handleDeleteGame"
                    >
                      刪除賽事
                    </UButton>
                  </div>
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </div>

    <!-- 分類編輯器 Modal - 新版格式 -->
    <UModal
      v-model:open="isCategoryEditorOpen"
      :title="editingCategory ? '編輯分類' : '新增分類'"
      description="設定賽事分類資訊"
    >
      <template #body>
        <div v-if="game" class="space-y-6">
          <!-- 基本資訊 -->
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="競賽類型" required>
              <USelect
                v-model="categoryForm.type"
                :items="typeOptions"
                placeholder="選擇競賽類型"
                required
                @change="
                  () => {
                    if (categoryForm.type === '對打' && !categoryForm.gender) {
                      categoryForm.gender = '個人'
                    }
                  }
                "
              />
            </UFormField>

            <UFormField label="組別" required>
              <UInput
                v-model="categoryForm.ageGroup"
                placeholder="手動輸入組別，例如：高中男子組"
                required
              />
            </UFormField>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="性別" required>
              <USelect
                v-model="categoryForm.gender"
                :items="
                  categoryForm.type === '對打'
                    ? getGenderOptions('對打')
                    : getGenderOptions('品勢')
                "
                placeholder="選擇性別"
                required
              />
            </UFormField>

            <UFormField
              v-if="categoryForm.type === '對打'"
              label="量級"
              required
            >
              <UInput
                v-model="categoryForm.weightClass"
                placeholder="輸入量級數字，例如：45、50、78以上"
              />
            </UFormField>
          </div>

          <UFormField label="完整分類名稱" required>
            <UInput
              v-model="categoryForm.fullName"
              placeholder="將自動生成完整名稱"
              readonly
              required
            />
          </UFormField>

          <!-- 預覽 -->
          <div class="rounded-md bg-gray-50 p-3 dark:bg-gray-800">
            <div class="text-sm text-gray-600 dark:text-gray-400">預覽</div>
            <div class="mt-1 font-medium">
              {{ categoryForm.fullName || "請填寫分類資訊" }}
            </div>
          </div>
        </div>
      </template>

      <template #footer="{ close }">
        <div class="flex justify-end gap-3">
          <UButton variant="ghost" @click="close"> 取消 </UButton>
          <UButton
            :disabled="!isCategoryFormValid"
            :loading="isCategorySubmitting"
            @click="handleCategorySubmit"
          >
            {{ editingCategory ? "儲存變更" : "建立分類" }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
