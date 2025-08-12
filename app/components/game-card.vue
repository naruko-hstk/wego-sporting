<script setup lang="ts">
import type { Game } from "~/types/game"

interface Props {
  game: Game
}

defineProps<Props>()

const { getGameStatus, getStatusText, getStatusColor } = useGameStatus()
const { formatDateRange } = useDateFormatter()
const { getRegionName } = useRegion()
</script>

<template>
  <UPageCard
    variant="subtle"
    :to="`/games/${game.id}`"
    highlight
    :highlight-color="getStatusColor(getGameStatus(game))"
    class="transition-all duration-500 hover:shadow-lg"
  >
    <template #title>
      <div class="flex items-start justify-between">
        <span class="text-lg font-bold">
          {{ game.name }}
        </span>
        <div class="ml-4 flex-shrink-0">
          <UBadge
            class="absolute top-7 right-3"
            :color="getStatusColor(getGameStatus(game))"
            variant="subtle"
          >
            {{ getStatusText(getGameStatus(game)) }}
          </UBadge>
        </div>
      </div>
    </template>

    <template #description>
      <div class="space-y-4">
        <!-- 場地資訊 -->
        <div class="flex items-center gap-3 text-base">
          <UIcon name="i-lucide-map-pin" class="h-5 w-5 text-gray-500" />
          <div class="flex items-center gap-1">
            <span class="font-semibold">{{ game.venue }}</span>
            <span>&middot;</span>
            <span>{{ getRegionName(game.region) }}</span>
          </div>
        </div>

        <!-- 時間資訊 -->
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-user-plus" class="h-5 w-5 text-blue-500" />
            <div class="flex flex-col gap-1">
              <span class="text-sm font-medium">報名時間</span>
              <span class="text-base">
                {{ formatDateRange(game.signupStart, game.signupEnd) }}
              </span>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-play-circle" class="h-5 w-5 text-green-500" />
            <div class="flex flex-col gap-1">
              <span class="text-sm font-medium">賽事時間</span>
              <span class="text-base">
                {{ formatDateRange(game.gameStart, game.gameEnd) }}
              </span>
            </div>
          </div>
        </div>

        <!-- 地址資訊 -->
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-navigation" class="mt-1 h-5 w-5" />
          <div class="flex flex-col gap-1">
            <span class="text-sm font-medium">地址</span>
            <span class="text-base leading-relaxed">
              {{ game.address }}
            </span>
          </div>
        </div>
      </div>
    </template>
  </UPageCard>
</template>

<style scoped></style>
