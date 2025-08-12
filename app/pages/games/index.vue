<script setup lang="ts">
import type { Game } from "~/types/game"

// 獲取賽事資料
const { data, pending, error, refresh } = useFetch<Game[]>("/api/games")

const games = computed(() => {
  if (!data.value || !Array.isArray(data.value)) return []
  return data.value as Game[]
})

// 篩選和排序選項
const selectedRegion = ref<string>("")
const selectedStatus = ref<string>("")
const sortBy = ref<string>("gameStart")

// 可用的區域選項
const regionOptions = computed(() => {
  const regions = games.value.map((game) => game.region)
  const uniqueRegions = [...new Set(regions)]
  return [
    { label: "全部地區", value: "" },
    ...uniqueRegions.map((region) => ({
      label: getRegionName(region),
      value: region,
    })),
  ]
})

// 狀態選項
const statusOptions = [
  { label: "全部狀態", value: "" },
  { label: "即將開始", value: "upcoming" },
  { label: "報名中", value: "registration" },
  { label: "已結束", value: "ended" },
]

// 排序選項
const sortOptions = [
  { label: "比賽日期", value: "gameStart" },
  { label: "報名截止", value: "signupEnd" },
  { label: "建立時間", value: "createdAt" },
]

// 篩選後的賽事
const filteredGames = computed(() => {
  let filtered = games.value

  // 按地區篩選
  if (selectedRegion.value) {
    filtered = filtered.filter((game) => game.region === selectedRegion.value)
  }

  // 按狀態篩選
  if (selectedStatus.value) {
    const now = new Date()
    filtered = filtered.filter((game) => {
      const signupEnd = new Date(game.signupEnd)
      const gameEnd = new Date(game.gameEnd)

      switch (selectedStatus.value) {
        case "upcoming":
          return now < signupEnd
        case "registration":
          return now >= new Date(game.signupStart) && now <= signupEnd
        case "ended":
          return now > gameEnd
        default:
          return true
      }
    })
  }

  // 排序
  return filtered.sort((a, b) => {
    const aValue = new Date(a[sortBy.value as keyof Game] as string)
    const bValue = new Date(b[sortBy.value as keyof Game] as string)
    return aValue.getTime() - bValue.getTime()
  })
})

const handleRefresh = () => {
  refresh()
}

// 清除篩選
const clearFilters = () => {
  selectedRegion.value = ""
  selectedStatus.value = ""
  sortBy.value = "gameStart"
}

// 頁面 Meta
useSeoMeta({
  title: "賽事列表 - 競賽報名系統",
  description: "查看所有跆拳道賽事，篩選和搜尋您感興趣的比賽",
})
</script>

<template>
  <div>
    <UPageHeader
      title="所有賽事"
      description="查看所有跆拳道賽事資訊，找到適合您的比賽"
      class="mb-8"
    >
      <template #links>
        <UButton
          icon="i-lucide-refresh-cw"
          variant="outline"
          size="sm"
          :loading="pending"
          @click="handleRefresh"
        >
          重新整理
        </UButton>
      </template>
    </UPageHeader>

    <!-- 篩選和排序 -->
    <UCard class="mb-6">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">篩選與排序</h3>
          <UButton
            variant="ghost"
            size="sm"
            icon="i-lucide-filter-x"
            @click="clearFilters"
          >
            清除篩選
          </UButton>
        </div>
      </template>

      <div class="grid gap-4 md:grid-cols-3">
        <!-- 地區篩選 -->
        <UFormField label="地區">
          <USelect
            v-model="selectedRegion"
            :options="regionOptions"
            placeholder="選擇地區"
          />
        </UFormField>

        <!-- 狀態篩選 -->
        <UFormField label="狀態">
          <USelect
            v-model="selectedStatus"
            :options="statusOptions"
            placeholder="選擇狀態"
          />
        </UFormField>

        <!-- 排序 -->
        <UFormField label="排序">
          <USelect
            v-model="sortBy"
            :options="sortOptions"
            placeholder="選擇排序方式"
          />
        </UFormField>
      </div>

      <!-- 結果統計 -->
      <div class="mt-4 text-sm text-gray-600 dark:text-gray-400">
        共找到 {{ filteredGames.length }} 場賽事
        <span v-if="games.length !== filteredGames.length">
          （從 {{ games.length }} 場賽事中篩選）
        </span>
      </div>
    </UCard>

    <!-- 載入中狀態 -->
    <UPageColumns v-if="pending">
      <USkeleton v-for="i in 6" :key="i" class="h-64 w-full rounded-lg" />
    </UPageColumns>

    <!-- 錯誤狀態 -->
    <EmptyState
      v-else-if="error"
      icon="i-lucide-triangle-alert"
      title="載入賽事資料時發生錯誤"
      action-text="重新載入"
      action-color="error"
      @action="handleRefresh"
    />

    <!-- 無資料狀態 -->
    <EmptyState
      v-else-if="!filteredGames.length && !selectedRegion && !selectedStatus"
      icon="i-lucide-calendar-x"
      title="目前沒有賽事"
      description="敬請期待更多精彩賽事"
      :show-action="false"
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
    <UPageColumns v-else>
      <GameCard v-for="game in filteredGames" :key="game.id" :game="game" />
    </UPageColumns>
  </div>
</template>

<style scoped></style>
