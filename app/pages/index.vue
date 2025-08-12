<script setup lang="ts">
import type { Game } from "~/types/game"

const { data, pending, error, refresh } = useFetch("/api/games", {})

const games = computed(() => {
  if (!data.value || !Array.isArray(data.value)) return []

  const now = new Date()
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  return (data.value as Game[]).filter((game) => {
    const gameEnd = new Date(game.gameEnd)
    // 排除完賽超過兩週的賽事
    return gameEnd >= twoWeeksAgo
  })
})

const handleRefresh = () => {
  refresh()
}
</script>

<template>
  <div>
    <UPageHeader
      title="近期賽事"
      description="查看最新的跆拳道賽事資訊"
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

    <!-- 載入中狀態 -->
    <UPageColumns v-if="pending">
      <USkeleton v-for="i in 8" :key="i" class="h-64 w-full rounded-lg" />
    </UPageColumns>

    <!-- 錯誤狀態 -->
    <empty-state
      v-else-if="error"
      icon="i-lucide-triangle-alert"
      title="載入賽事資料時發生錯誤"
      description="請稍後再試或重新載入"
    >
      <template #actions>
        <UButton color="red" @click="handleRefresh">重新載入</UButton>
      </template>
    </empty-state>

    <!-- 無資料狀態 -->
    <empty-state
      v-else-if="!games.length"
      icon="i-lucide-calendar-x"
      title="目前沒有近期賽事"
      description="敬請期待更多精彩賽事"
    />

    <!-- 賽事列表 -->
    <UPageColumns v-else>
      <GameCard v-for="game in games" :key="game.id" :game="game" />
    </UPageColumns>
  </div>
</template>

<style scoped></style>
