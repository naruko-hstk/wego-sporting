<script setup lang="ts">
import type { Team } from "~/types/game"

const route = useRoute()
const router = useRouter()
const teamId = route.params.id as string

// 獲取隊伍資料
const {
  data: team,
  pending,
  error,
  refresh,
} = await useFetch<Team>(`/api/team/${teamId}`, {
  headers: useRequestHeaders(["cookie"]),
  server: false,
  retry: 2, // 添加重試機制
  retryDelay: 500, // 重試延遲
})

// 當加載完成且有錯誤時才顯示 404
const showNotFound = computed(
  () => !pending.value && (error.value || !team.value),
)

// 手動重新獲取數據的函數
const handleRefresh = async () => {
  await refresh()
}

// 頁面 Meta
useSeoMeta({
  title: () => (team.value ? `${team.value.name} - 隊伍詳情` : "隊伍詳情"),
  description: () =>
    team.value
      ? `查看 ${team.value.name} 的詳細資訊和成員列表`
      : "隊伍詳情頁面",
})

// 格式化日期
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// 統計數據
const stats = computed(() => {
  if (!team.value) return []

  return [
    {
      label: "成員數量",
      value: team.value._count.team_member,
      icon: "i-lucide-users",
      color: "primary" as const,
    },
    {
      label: "報名比賽",
      value: team.value._count.registration,
      icon: "i-lucide-trophy",
      color: "success" as const,
    },
    {
      label: "創建時間",
      value: formatDate(team.value.createdAt),
      icon: "i-lucide-calendar",
      color: "neutral" as const,
    },
  ]
})

// 最近成員（最多顯示6個）
const recentMembers = computed(() => {
  return team.value?.team_member.slice(0, 6) || []
})

// 成員性別統計
const genderStats = computed(() => {
  if (!team.value?.team_member.length) return { male: 0, female: 0 }

  const male = team.value.team_member.filter((m) => m.gender === "男").length
  const female = team.value.team_member.filter((m) => m.gender === "女").length

  return { male, female }
})

// 隊職員統計（跆拳道賽事標準）
const staffStats = computed(() => {
  if (!team.value?.team_member.length) {
    return { athletes: 0, coaches: 0, officials: 0 }
  }

  const members = team.value.team_member

  // 選手（運動員）
  const athletes = members.filter((m) =>
    ["選手", "運動員", "隊員", "球員", "參賽者"].some((role) =>
      m.role.includes(role),
    ),
  ).length

  // 教練團
  const coaches = members.filter((m) =>
    ["教練", "總教練", "助理教練", "技術指導", "指導教練"].some((role) =>
      m.role.includes(role),
    ),
  ).length

  // 隊職員（領隊、管理、醫護等）
  const officials = members.filter((m) =>
    ["領隊", "隊長", "管理", "經理", "隊務", "醫護", "防護員", "翻譯"].some(
      (role) => m.role.includes(role),
    ),
  ).length

  return { athletes, coaches, officials }
})
</script>

<template>
  <div>
    <!-- Loading 狀態 -->
    <div v-if="pending" class="space-y-6">
      <USkeleton class="h-20 w-full" />
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <USkeleton v-for="i in 4" :key="i" class="h-24 w-full" />
      </div>
      <USkeleton class="h-64 w-full" />
    </div>

    <!-- 隊伍詳情 -->
    <div v-else-if="team">
      <!-- 頁面標題 -->
      <UPageHeader class="mb-8">
        <template #title>{{ team.name }}</template>

        <template #links>
          <UButton icon="i-lucide-arrow-left" variant="ghost" to="/team">
            返回隊伍列表
          </UButton>
        </template>
      </UPageHeader>

      <UPageGrid>
        <!-- 統計卡片 -->
        <UPageCard class="col-span-full">
          <template #header>
            <h2 class="text-xl font-semibold">隊伍概況</h2>
          </template>

          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="stat in stats"
              :key="stat.label"
              class="flex items-center gap-4 rounded-lg border p-4 dark:border-gray-700"
            >
              <div class="flex-shrink-0">
                <UIcon
                  :name="stat.icon"
                  class="h-8 w-8"
                  :class="{
                    'text-primary-500': stat.color === 'primary',
                    'text-success-500': stat.color === 'success',
                    'text-gray-500': stat.color === 'neutral',
                  }"
                />
              </div>
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ stat.label }}
                </p>
                <p class="text-2xl font-bold">{{ stat.value }}</p>
              </div>
            </div>
          </div>
        </UPageCard>

        <!-- 成員概覽 -->
        <UPageCard class="col-span-full lg:col-span-2">
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-semibold">隊伍成員</h2>
              <UButton
                icon="i-lucide-settings"
                variant="outline"
                @click="router.push(`/team/${teamId}/members`)"
              >
                管理成員
              </UButton>
            </div>
          </template>

          <div v-if="recentMembers.length > 0" class="space-y-4">
            <!-- 成員列表 -->
            <div class="grid gap-3">
              <div
                v-for="member in recentMembers"
                :key="member.id"
                class="flex items-center gap-3 rounded-lg border p-3 dark:border-gray-700"
              >
                <UAvatar :alt="member.name" size="sm" />
                <div class="min-w-0 flex-1">
                  <p class="truncate font-medium">{{ member.name }}</p>
                  <p class="truncate text-sm text-gray-500 dark:text-gray-400">
                    {{ member.role }}
                  </p>
                </div>
                <div class="flex items-center gap-2 text-xs text-gray-400">
                  <span>{{ member.gender }}</span>
                </div>
              </div>
            </div>

            <!-- 查看更多 -->
            <div v-if="team._count.team_member > 6" class="pt-2 text-center">
              <UButton
                variant="ghost"
                size="sm"
                @click="router.push(`/team/${teamId}/members`)"
              >
                查看全部 {{ team._count.team_member }} 位成員
                <UIcon name="i-lucide-arrow-right" class="ml-1 h-4 w-4" />
              </UButton>
            </div>
          </div>

          <!-- 空狀態 -->
          <div v-else class="py-8 text-center">
            <UIcon
              name="i-lucide-users"
              class="mx-auto mb-4 h-12 w-12 text-gray-400"
            />
            <h3 class="mb-2 font-semibold">還沒有成員</h3>
            <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">
              開始新增隊伍成員來組建你的團隊
            </p>
            <UButton
              icon="i-lucide-plus"
              @click="router.push(`/team/${teamId}/members`)"
            >
              新增成員
            </UButton>
          </div>
        </UPageCard>

        <!-- 隊伍資訊 -->
        <UPageCard>
          <template #header>
            <h2 class="text-xl font-semibold">隊伍資訊</h2>
          </template>

          <div class="space-y-4">
            <!-- 隊職員統計 -->
            <div v-if="team._count.team_member > 0">
              <h3 class="mb-2 font-medium">隊職員組成</h3>
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600 dark:text-gray-400">
                    選手
                  </span>
                  <span class="font-medium">{{ staffStats.athletes }} 人</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600 dark:text-gray-400">
                    教練團
                  </span>
                  <span class="font-medium">{{ staffStats.coaches }} 人</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600 dark:text-gray-400">
                    隊職員
                  </span>
                  <span class="font-medium">{{ staffStats.officials }} 人</span>
                </div>
              </div>
            </div>

            <!-- 成員性別分布 -->
            <div v-if="team._count.team_member > 0">
              <h3 class="mb-2 font-medium">性別組成</h3>
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600 dark:text-gray-400">
                    男性
                  </span>
                  <span class="font-medium">{{ genderStats.male }} 人</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600 dark:text-gray-400">
                    女性
                  </span>
                  <span class="font-medium">{{ genderStats.female }} 人</span>
                </div>
              </div>
            </div>

            <!-- 隊伍詳細資訊 -->
            <!-- 隊伍詳細資訊 -->
            <div class="border-t pt-4 dark:border-gray-700">
              <h3 class="mb-2 font-medium">詳細資訊</h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">創建者</span>
                  <span>{{ team.user?.name }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">創建時間</span>
                  <span>{{ formatDate(team.createdAt) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">最後更新</span>
                  <span>{{ formatDate(team.updatedAt) }}</span>
                </div>
              </div>
            </div>
          </div>
        </UPageCard>

        <!-- 報名狀況 -->
        <UPageCard class="col-span-full">
          <template #header>
            <h2 class="text-xl font-semibold">報名狀況</h2>
          </template>

          <div v-if="team._count.registration > 0" class="space-y-4">
            <div class="text-center">
              <div class="text-primary-500 text-3xl font-bold">
                {{ team._count.registration }}
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                已報名比賽數量
              </p>
            </div>

            <!-- 可以在這裡添加報名比賽的詳細列表 -->
            <div class="text-center">
              <UButton variant="outline" size="sm"> 查看報名記錄 </UButton>
            </div>
          </div>

          <div v-else class="py-8 text-center">
            <UIcon
              name="i-lucide-trophy"
              class="mx-auto mb-4 h-12 w-12 text-gray-400"
            />
            <h3 class="mb-2 font-semibold">尚未報名任何比賽</h3>
            <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">
              帶領你的隊伍參加比賽吧！
            </p>
            <UButton icon="i-lucide-search" @click="router.push('/games')">
              瀏覽比賽
            </UButton>
          </div>
        </UPageCard>
      </UPageGrid>
    </div>

    <!-- 錯誤狀態 -->
    <div v-else-if="showNotFound" class="py-16 text-center">
      <UIcon
        name="i-lucide-alert-circle"
        class="text-error-500 mx-auto mb-4 h-16 w-16"
      />
      <h2 class="mb-2 text-2xl font-bold">隊伍不存在</h2>
      <p class="mb-6 text-gray-500 dark:text-gray-400">
        找不到指定的隊伍，可能已被刪除或您沒有查看權限
      </p>
      <div class="flex justify-center gap-4">
        <UButton
          icon="i-lucide-refresh-cw"
          variant="outline"
          :loading="pending"
          @click="handleRefresh"
        >
          重新載入
        </UButton>
        <UButton icon="i-lucide-arrow-left" variant="outline" to="/team">
          返回隊伍列表
        </UButton>
      </div>
    </div>
  </div>
</template>
