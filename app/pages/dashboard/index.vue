<script setup lang="ts">
import { useDashboardStats } from "~/composables/use-dashboard-stats"

definePageMeta({
  layout: "dashboard",
})

const { statistics, isLoading, error } = useDashboardStats()

// Get recent games and registrations
const games = await $fetch("/api/games")
const recentGames = computed(() => {
  return Array.isArray(games) ? games.slice(0, 5) : []
})

// Stats cards data
const statsCards = computed(() => [
  {
    title: "總賽事數",
    value: statistics.value.gamesCount?.toString() ?? "0",
    icon: "i-lucide-swords",
    color: "blue" as const,
    to: "/dashboard/games",
  },
  {
    title: "總用戶數",
    value: statistics.value.usersCount?.toString() ?? "0",
    icon: "i-lucide-users-round",
    color: "green" as const,
    to: "/dashboard/users",
  },
  {
    title: "活躍賽事",
    value: recentGames.value.length.toString(),
    icon: "i-lucide-activity",
    color: "orange" as const,
    to: "/dashboard/games",
  },
  {
    title: "本月註冊",
    value: statistics.value.monthlyRegistrations?.toString() ?? "0",
    icon: "i-lucide-user-plus",
    color: "purple" as const,
    to: "/dashboard/users",
  },
])
</script>

<template>
  <div class="space-y-8">
    <!-- Page Header -->
    <div>
      <h1 class="text-primary text-3xl font-bold">概覽</h1>
      <p class="mt-2 text-gray-600">競賽報名系統管理後台</p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <UIcon
        name="i-lucide-loader-2"
        class="text-primary h-8 w-8 animate-spin"
      />
      <span class="ml-2 text-gray-600">載入中...</span>
    </div>

    <!-- Error State -->
    <UAlert
      v-else-if="error"
      color="red"
      variant="soft"
      title="載入錯誤"
      :description="error"
      icon="i-lucide-alert-triangle"
    />

    <!-- Stats Cards -->
    <div v-else class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      <UCard
        v-for="stat in statsCards"
        :key="stat.title"
        class="cursor-pointer transition-shadow hover:shadow-lg"
        :to="stat.to"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">{{ stat.title }}</p>
            <p class="mt-1 text-2xl font-bold">{{ stat.value }}</p>
          </div>
          <div :class="`rounded-lg p-3 bg-${stat.color}-100`">
            <UIcon
              :name="stat.icon"
              :class="`h-6 w-6 text-${stat.color}-600`"
            />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Recent Activities -->
    <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <!-- Recent Games -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">最近賽事</h3>
            <UButton variant="ghost" size="sm" to="/dashboard/games">
              查看全部
              <UIcon name="i-lucide-arrow-right" class="ml-1 h-4 w-4" />
            </UButton>
          </div>
        </template>

        <div class="space-y-4">
          <div
            v-for="game in recentGames"
            :key="game.id"
            class="rounded-lg border p-3"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <h4 class="font-medium">{{ game.name }}</h4>
                <p class="text-sm text-gray-600">
                  {{ game.region }} • {{ game.venue }}
                </p>
              </div>
              <div class="text-right">
                <UBadge
                  :color="
                    new Date(game.signupEnd) > new Date()
                      ? 'green'
                      : new Date(game.gameStart) > new Date()
                        ? 'blue'
                        : 'gray'
                  "
                  variant="soft"
                >
                  {{
                    new Date(game.signupEnd) > new Date()
                      ? "報名中"
                      : new Date(game.gameStart) > new Date()
                        ? "即將開始"
                        : "已結束"
                  }}
                </UBadge>
                <p class="mt-1 text-xs text-gray-500">
                  {{ game._count?.registration ?? 0 }} 人報名
                </p>
              </div>
            </div>
          </div>

          <div
            v-if="recentGames.length === 0"
            class="py-8 text-center text-gray-500"
          >
            <UIcon name="i-lucide-calendar-x" class="mx-auto mb-2 h-8 w-8" />
            <p>暫無賽事資料</p>
          </div>
        </div>
      </UCard>

      <!-- Quick Actions -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">快速操作</h3>
        </template>

        <div class="space-y-3">
          <UButton
            block
            size="lg"
            to="/dashboard/games?action=create"
            icon="i-lucide-plus"
          >
            新增賽事
          </UButton>

          <UButton
            block
            size="lg"
            variant="outline"
            to="/dashboard/users"
            icon="i-lucide-users"
          >
            管理用戶
          </UButton>

          <UButton
            block
            size="lg"
            variant="outline"
            to="/dashboard/games"
            icon="i-lucide-settings"
          >
            賽事設定
          </UButton>

          <UButton block size="lg" variant="soft" to="/" icon="i-lucide-home">
            返回前台
          </UButton>
        </div>
      </UCard>
    </div>
  </div>
</template>

<style scoped></style>
