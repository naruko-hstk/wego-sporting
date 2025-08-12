<script setup lang="ts">
import type { Game } from "~/types/game"

const route = useRoute()
const region = route.params.region as string

const { data, pending, error, refresh } = useFetch<Game[]>(
  `/api/games?region=${region}`,
)

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

const regionTitle = computed(() => {
  return getRegionName(region)
})

const handleRefresh = () => {
  refresh()
}
</script>

<template>
  <div>
    <UPageHeader
      :title="`${regionTitle}地區賽事`"
      :description="`查看${regionTitle}地區的跆拳道賽事資訊`"
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
      v-else-if="!games.length"
      icon="i-lucide-calendar-x"
      :title="`${regionTitle}地區目前沒有賽事`"
      description="敬請期待更多精彩賽事"
      :show-action="false"
    />

    <!-- 賽事列表 -->
    <UPageColumns v-else>
      <GameCard v-for="game in games" :key="game.id" :game="game" />
    </UPageColumns>
  </div>
</template>

<style scoped></style>
