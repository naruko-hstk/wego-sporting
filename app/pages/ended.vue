<script setup lang="ts">
import type { Game } from "~/types/game"

// 設定頁面 meta
useSeoMeta({
  title: "已結束賽事",
  description: "查看所有已結束的運動賽事",
})

const { getGameStatus } = useGameStatus()
const { formatDateRange } = useDateFormatter()
const { getRegionName } = useRegion()

// 取得所有賽事資料
const {
  data: allGames,
  pending,
  error,
  refresh,
} = await useLazyFetch<Game[]>("/api/games")

// 篩選出已結束超過兩週的賽事
const endedGames = computed(() => {
  if (!allGames.value) return []

  const twoWeeksAgo = new Date()
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

  return allGames.value.filter((game: Game) => {
    const gameStatus = getGameStatus(game)
    const gameEndDate = new Date(game.gameEnd)

    // 只顯示已結束且結束超過兩週的賽事
    return gameStatus === "ended" && gameEndDate < twoWeeksAgo
  })
})

// 載入狀態
const isLoading = computed(() => pending.value)

// 頁面標題和描述
const pageTitle = "已結束賽事"
const pageDescription = "查看所有已結束超過兩週的運動賽事記錄"
</script>

<template>
  <UContainer class="py-8">
    <!-- 頁面標題區域 -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold tracking-tight">
            {{ pageTitle }}
          </h1>
          <p class="mt-2 text-lg text-gray-600 dark:text-gray-400">
            {{ pageDescription }}
          </p>
        </div>

        <!-- 重新整理按鈕 -->
        <UButton
          icon="i-lucide-refresh-cw"
          variant="outline"
          :loading="isLoading"
          @click="() => refresh()"
        >
          重新整理
        </UButton>
      </div>
    </div>

    <!-- 載入狀態 -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="h-8 w-8 animate-spin" />
    </div>

    <!-- 錯誤狀態 -->
    <div v-else-if="error" class="py-12">
      <UAlert
        icon="i-lucide-alert-triangle"
        color="red"
        variant="subtle"
        title="載入失敗"
        description="無法載入賽事資料，請稍後再試"
      />
    </div>

    <!-- 賽事列表 -->
    <div v-else-if="endedGames.length > 0">
      <!-- 統計資訊 -->
      <div class="mb-6">
        <UAlert
          icon="i-lucide-archive"
          color="gray"
          variant="subtle"
          :title="`共找到 ${endedGames.length} 個已結束賽事`"
          description="這些賽事已結束超過兩週，已移至檔案庫"
        />
      </div>

      <!-- 賽事列表 -->
      <UPageList divide>
        <NuxtLink
          v-for="game in endedGames"
          :key="game.id"
          :to="`/games/${game.id}`"
          class="block p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-3">
                <h3 class="text-lg font-semibold">{{ game.name }}</h3>
                <UBadge color="neutral" variant="subtle">已結束</UBadge>
              </div>
              <div
                class="mt-2 flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400"
              >
                <div class="flex items-center gap-1">
                  <UIcon name="i-lucide-map-pin" class="h-4 w-4" />
                  <span
                    >{{ game.venue }} · {{ getRegionName(game.region) }}</span
                  >
                </div>
                <div class="flex items-center gap-1">
                  <UIcon name="i-lucide-calendar" class="h-4 w-4" />
                  <span>{{
                    formatDateRange(game.gameStart, game.gameEnd)
                  }}</span>
                </div>
              </div>
            </div>
            <UIcon
              name="i-lucide-chevron-right"
              class="h-5 w-5 text-gray-400"
            />
          </div>
        </NuxtLink>
      </UPageList>
    </div>

    <!-- 空狀態 -->
    <div v-else class="py-12">
      <EmptyState
        icon="i-lucide-archive"
        title="沒有已結束的賽事"
        description="目前沒有結束超過兩週的賽事記錄"
      >
        <template #actions>
          <UButton to="/games" icon="i-lucide-calendar" variant="outline">
            查看進行中賽事
          </UButton>
        </template>
      </EmptyState>
    </div>
  </UContainer>
</template>

<style scoped></style>
