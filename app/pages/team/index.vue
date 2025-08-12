<script setup lang="ts">
interface TeamMember {
  id: string
  name: string
  role: string
  gender: string
  birthday: string
  phone: string | null
  lineId: string | null
  email: string | null
  isBanned: boolean
}

interface Team {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  team_member: TeamMember[]
  _count: {
    team_member: number
  }
}

// 獲取使用者的隊伍
const {
  data: teams,
  pending,
  error,
  refresh,
} = await useFetch<Team[]>("/api/team", {
  server: false,
})

// 隊伍操作狀態
const isCreateModalOpen = ref(false)
const isEditModalOpen = ref(false)
const selectedTeam = ref<Team | null>(null)

// 新增隊伍
const handleCreateTeam = () => {
  isCreateModalOpen.value = true
}

// 編輯隊伍
const handleEditTeam = (team: Team) => {
  selectedTeam.value = team
  isEditModalOpen.value = true
}

// 刪除隊伍
const handleDeleteTeam = async (team: Team) => {
  const confirmed = confirm(`確定要刪除隊伍「${team.name}」嗎？`)
  if (!confirmed) return

  try {
    await $fetch<{ success: boolean }>(`/api/team/${team.id}`, {
      method: "DELETE" as const,
    })
    await refresh()
  } catch (error) {
    console.error("刪除隊伍失敗:", error)
  }
}

// 管理成員
const handleManageMembers = (team: Team) => {
  navigateTo(`/team/${team.id}/members`)
}

// 查看詳情
const handleViewDetails = (team: Team) => {
  navigateTo(`/team/${team.id}`)
}

definePageMeta({
  title: "我的隊伍",
})
</script>

<template>
  <div>
    <UPageHeader
      title="我的隊伍"
      description="管理您的隊伍和成員資訊"
      class="mb-8"
    >
      <template #links>
        <UButton icon="i-lucide-plus" @click="handleCreateTeam">
          建立隊伍
        </UButton>
      </template>
    </UPageHeader>

    <!-- 載入中 -->
    <UPageColumns v-if="pending">
      <USkeleton v-for="i in 8" :key="i" class="h-64 w-full rounded-lg" />
    </UPageColumns>

    <!-- 錯誤狀態 -->
    <EmptyState
      v-else-if="error"
      icon="i-lucide-triangle-alert"
      title="載入隊伍資料時發生錯誤"
      action-text="重新載入"
      @action="refresh"
    />

    <!-- 空狀態 -->
    <EmptyState
      v-else-if="!teams?.length"
      icon="i-lucide-users"
      title="還沒有隊伍"
      description="建立第一個隊伍開始參加比賽吧！"
      action-text="建立隊伍"
      action-icon="i-lucide-plus"
      @action="handleCreateTeam"
    />

    <!-- 隊伍列表 -->
    <UPageGrid v-else>
      <UCard
        v-for="team in teams"
        :key="team.id"
        class="transition-shadow hover:shadow-lg"
      >
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">{{ team.name }}</h3>
            <UDropdownMenu
              :items="[
                [
                  {
                    label: '編輯隊伍',
                    icon: 'i-lucide-pencil',
                    onSelect: () => handleEditTeam(team),
                  },
                  {
                    label: '管理成員',
                    icon: 'i-lucide-users',
                    onSelect: () => handleManageMembers(team),
                  },
                ],
                [
                  {
                    label: '刪除隊伍',
                    icon: 'i-lucide-trash-2',
                    color: 'error',
                    onSelect: () => handleDeleteTeam(team),
                  },
                ],
              ]"
            >
              <UButton variant="ghost" icon="i-lucide-more-vertical" />
            </UDropdownMenu>
          </div>
        </template>

        <div class="space-y-4">
          <!-- 隊伍統計 -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-users" class="h-4 w-4" />
              <span class="text-sm">{{ team._count.team_member }} 名成員</span>
            </div>
            <UBadge variant="outline">
              {{ new Date(team.createdAt).toLocaleDateString("zh-TW") }}
            </UBadge>
          </div>

          <!-- 成員預覽 -->
          <div v-if="team.team_member.length" class="space-y-2">
            <p class="text-sm font-medium">成員：</p>
            <div class="space-y-1">
              <div
                v-for="member in team.team_member.slice(0, 3)"
                :key="member.id"
                class="flex items-center justify-between text-sm"
              >
                <span>{{ member.name }}</span>
                <UBadge size="xs" variant="outline">{{ member.role }}</UBadge>
              </div>
              <p v-if="team.team_member.length > 3" class="text-sm">
                還有 {{ team.team_member.length - 3 }} 名成員...
              </p>
            </div>
          </div>

          <!-- 動作按鈕 -->
          <div class="flex gap-2 pt-2">
            <UButton
              variant="outline"
              size="sm"
              class="flex-1"
              @click="handleViewDetails(team)"
            >
              查看詳情
            </UButton>
            <UButton
              size="sm"
              class="flex-1"
              @click="handleManageMembers(team)"
            >
              管理成員
            </UButton>
          </div>
        </div>
      </UCard>
    </UPageGrid>

    <!-- 建立/編輯隊伍彈窗 -->
    <TeamEditor
      v-model:open="isCreateModalOpen"
      @success="
        () => {
          isCreateModalOpen = false
          refresh()
        }
      "
    />

    <TeamEditor
      v-model:open="isEditModalOpen"
      :team="selectedTeam"
      @success="
        () => {
          isEditModalOpen = false
          selectedTeam = null
          refresh()
        }
      "
    />
  </div>
</template>
