<script setup lang="ts">
import type { TeamStaff, UserPlayer } from "~/types/team"

interface Team {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  team_staff: TeamStaff[]
  _count: {
    team_staff: number
    registration: number
  }
}

// 頁面標題
definePageMeta({
  title: "隊伍管理",
  layout: "dashboard",
})

// 獲取使用者的隊伍
const {
  data: teams,
  pending: teamsLoading,
  error: teamsError,
  refresh: refreshTeams,
} = await useFetch<Team[]>("/api/team", {
  server: false,
})

// 獲取使用者的隊員
const {
  data: userPlayers,
  pending: playersLoading,
  error: playersError,
  refresh: refreshPlayers,
} = await useFetch<UserPlayer[]>("/api/user_player", {
  server: false,
})

// 狀態管理
const selectedTab = ref("teams") // teams | players
const isCreateTeamModalOpen = ref(false)
const isEditTeamModalOpen = ref(false)
const selectedTeam = ref<Team | null>(null)

const isCreatePlayerModalOpen = ref(false)
const isEditPlayerModalOpen = ref(false)
const selectedPlayer = ref<UserPlayer | null>(null)

const isCreateStaffModalOpen = ref(false)
const isEditStaffModalOpen = ref(false)
const selectedStaff = ref<TeamStaff | null>(null)
const staffTeamId = ref<string>("")

// Tab 選項
const tabs = [
  { key: "teams", label: "隊伍管理", icon: "i-lucide-shield" },
  { key: "players", label: "隊員管理", icon: "i-lucide-users" },
]

// 隊伍操作
const handleCreateTeam = () => {
  isCreateTeamModalOpen.value = true
}

const handleEditTeam = (team: Team) => {
  selectedTeam.value = team
  isEditTeamModalOpen.value = true
}

const handleDeleteTeam = async (team: Team) => {
  if (!confirm(`確定要刪除隊伍「${team.name}」嗎？`)) return

  try {
    await $fetch(`/api/team/${team.id}`, { method: "DELETE" })
    await refreshTeams()
  } catch (error) {
    console.error("刪除隊伍失敗:", error)
  }
}

// 隊員操作
const handleCreatePlayer = () => {
  isCreatePlayerModalOpen.value = true
}

const handleEditPlayer = (player: UserPlayer) => {
  selectedPlayer.value = player
  isEditPlayerModalOpen.value = true
}

const handleDeletePlayer = async (player: UserPlayer) => {
  if (!confirm(`確定要刪除隊員「${player.name}」嗎？`)) return

  try {
    await $fetch(`/api/user_player/${player.id}`, { method: "DELETE" })
    await refreshPlayers()
  } catch (error) {
    console.error("刪除隊員失敗:", error)
  }
}

// 隊職員操作
const handleCreateStaff = (teamId: string) => {
  staffTeamId.value = teamId
  isCreateStaffModalOpen.value = true
}

const handleEditStaff = (staff: TeamStaff) => {
  selectedStaff.value = staff
  staffTeamId.value = staff.teamId
  isEditStaffModalOpen.value = true
}

const handleDeleteStaff = async (staff: TeamStaff) => {
  if (!confirm(`確定要刪除隊職員「${staff.name}」嗎？`)) return

  try {
    await $fetch(`/api/team_staff/${staff.id}`, { method: "DELETE" })
    await refreshTeams()
  } catch (error) {
    console.error("刪除隊職員失敗:", error)
  }
}

// 成功回調
const handleTeamSuccess = () => {
  refreshTeams()
  isCreateTeamModalOpen.value = false
  isEditTeamModalOpen.value = false
  selectedTeam.value = null
}

const handlePlayerSuccess = () => {
  refreshPlayers()
  isCreatePlayerModalOpen.value = false
  isEditPlayerModalOpen.value = false
  selectedPlayer.value = null
}

const handleStaffSuccess = () => {
  refreshTeams()
  isCreateStaffModalOpen.value = false
  isEditStaffModalOpen.value = false
  selectedStaff.value = null
  staffTeamId.value = ""
}

// 計算年齡
const calculateAge = (birthday: string) => {
  const birth = new Date(birthday)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

// 角色顯示
const getRoleDisplay = (role: string) => {
  return role === "leader" ? "領隊" : role === "coach" ? "教練" : role
}

// 性別顯示
const getGenderDisplay = (gender: string) => {
  return gender === "M" ? "男" : "女"
}
</script>

<template>
  <div class="space-y-6">
    <!-- 頁面標題和操作 -->
    <UPageHeader title="隊伍管理" description="管理你的隊伍、隊職員和隊員資訊">
      <template #actions>
        <UButton
          v-if="selectedTab === 'teams'"
          icon="i-lucide-plus"
          @click="handleCreateTeam"
        >
          建立隊伍
        </UButton>
        <UButton
          v-if="selectedTab === 'players'"
          icon="i-lucide-plus"
          @click="handleCreatePlayer"
        >
          新增隊員
        </UButton>
      </template>
    </UPageHeader>

    <!-- Tab 導航 -->
    <UTabs v-model="selectedTab" :items="tabs" />

    <!-- 隊伍管理 Tab -->
    <div v-if="selectedTab === 'teams'">
      <!-- 載入狀態 -->
      <div v-if="teamsLoading" class="space-y-4">
        <USkeleton v-for="i in 3" :key="i" class="h-48" />
      </div>

      <!-- 錯誤狀態 -->
      <EmptyState
        v-else-if="teamsError"
        icon="i-lucide-triangle-alert"
        title="載入隊伍資料時發生錯誤"
        action-text="重新載入"
        @action="refreshTeams"
      />

      <!-- 空狀態 -->
      <EmptyState
        v-else-if="!teams?.length"
        icon="i-lucide-shield"
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
                      label: '新增隊職員',
                      icon: 'i-lucide-user-plus',
                      onSelect: () => handleCreateStaff(team.id),
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
                <UIcon name="i-lucide-user-check" class="h-4 w-4" />
                <span class="text-sm">{{ team._count.team_staff }} 名職員</span>
              </div>
              <UBadge variant="outline">
                {{ new Date(team.createdAt).toLocaleDateString("zh-TW") }}
              </UBadge>
            </div>

            <!-- 隊職員列表 -->
            <div v-if="team.team_staff.length" class="space-y-2">
              <p class="text-sm font-medium">隊職員：</p>
              <div class="space-y-2">
                <div
                  v-for="staff in team.team_staff"
                  :key="staff.id"
                  class="flex items-center justify-between rounded-lg border p-3 text-sm"
                >
                  <div>
                    <span class="font-medium">{{ staff.name }}</span>
                    <UBadge size="xs" variant="outline" class="ml-2">
                      {{ getRoleDisplay(staff.role) }}
                    </UBadge>
                  </div>
                  <div class="flex gap-1">
                    <UButton
                      variant="ghost"
                      size="xs"
                      icon="i-lucide-pencil"
                      @click="handleEditStaff(staff)"
                    />
                    <UButton
                      variant="ghost"
                      size="xs"
                      color="red"
                      icon="i-lucide-trash-2"
                      @click="handleDeleteStaff(staff)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- 空的隊職員狀態 -->
            <div v-else class="py-4 text-center">
              <p class="text-sm text-gray-500">尚未新增隊職員</p>
              <UButton
                variant="ghost"
                size="sm"
                class="mt-2"
                @click="handleCreateStaff(team.id)"
              >
                新增隊職員
              </UButton>
            </div>
          </div>
        </UCard>
      </UPageGrid>
    </div>

    <!-- 隊員管理 Tab -->
    <div v-if="selectedTab === 'players'">
      <!-- 載入狀態 -->
      <div v-if="playersLoading" class="space-y-4">
        <USkeleton v-for="i in 3" :key="i" class="h-32" />
      </div>

      <!-- 錯誤狀態 -->
      <EmptyState
        v-else-if="playersError"
        icon="i-lucide-triangle-alert"
        title="載入隊員資料時發生錯誤"
        action-text="重新載入"
        @action="refreshPlayers"
      />

      <!-- 空狀態 -->
      <EmptyState
        v-else-if="!userPlayers?.length"
        icon="i-lucide-users"
        title="還沒有隊員"
        description="新增隊員資料，讓他們可以參與所有隊伍的比賽！"
        action-text="新增隊員"
        action-icon="i-lucide-plus"
        @action="handleCreatePlayer"
      />

      <!-- 隊員列表 -->
      <UPageGrid v-else>
        <UCard
          v-for="player in userPlayers"
          :key="player.id"
          class="transition-shadow hover:shadow-lg"
        >
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <UAvatar :text="player.name.charAt(0)" size="sm" />
                <div>
                  <h3 class="font-semibold">{{ player.name }}</h3>
                  <p class="text-sm text-gray-500">
                    {{ getGenderDisplay(player.gender) }} ·
                    {{ calculateAge(player.birthday) }} 歲
                  </p>
                </div>
              </div>
              <UDropdownMenu
                :items="[
                  [
                    {
                      label: '編輯隊員',
                      icon: 'i-lucide-pencil',
                      onSelect: () => handleEditPlayer(player),
                    },
                  ],
                  [
                    {
                      label: '刪除隊員',
                      icon: 'i-lucide-trash-2',
                      color: 'error',
                      onSelect: () => handleDeletePlayer(player),
                    },
                  ],
                ]"
              >
                <UButton variant="ghost" icon="i-lucide-more-vertical" />
              </UDropdownMenu>
            </div>
          </template>

          <div class="space-y-3">
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600">生日</span>
              <span>{{
                new Date(player.birthday).toLocaleDateString("zh-TW")
              }}</span>
            </div>

            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600">參賽次數</span>
              <UBadge variant="outline">
                {{ player._count?.registration_participant || 0 }} 次
              </UBadge>
            </div>

            <div v-if="player.isBanned" class="rounded-lg bg-red-50 p-3">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-ban" class="h-4 w-4 text-red-500" />
                <span class="text-sm font-medium text-red-700">已被停用</span>
              </div>
              <p v-if="player.banReason" class="mt-1 text-sm text-red-600">
                {{ player.banReason }}
              </p>
            </div>
          </div>
        </UCard>
      </UPageGrid>
    </div>

    <!-- 建立/編輯隊伍彈窗 -->
    <TeamEditor
      v-model:open="isCreateTeamModalOpen"
      @success="handleTeamSuccess"
    />

    <TeamEditor
      v-model:open="isEditTeamModalOpen"
      :team="selectedTeam"
      @success="handleTeamSuccess"
    />

    <!-- 建立/編輯隊員彈窗 -->
    <UserPlayerEditor
      v-model:open="isCreatePlayerModalOpen"
      @success="handlePlayerSuccess"
    />

    <UserPlayerEditor
      v-model:open="isEditPlayerModalOpen"
      :user-player="selectedPlayer"
      @success="handlePlayerSuccess"
    />

    <!-- 建立/編輯隊職員彈窗 -->
    <TeamStaffEditor
      v-model:open="isCreateStaffModalOpen"
      :team-id="staffTeamId"
      @success="handleStaffSuccess"
    />

    <TeamStaffEditor
      v-model:open="isEditStaffModalOpen"
      :team-id="staffTeamId"
      :team-staff="selectedStaff"
      @success="handleStaffSuccess"
    />
  </div>
</template>
