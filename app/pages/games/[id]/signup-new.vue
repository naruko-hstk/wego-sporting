<template>
  <div class="container mx-auto space-y-8 p-4">
    <div v-if="loading" class="text-center">
      <UIcon
        name="i-heroicons-arrow-path"
        class="mx-auto h-8 w-8 animate-spin"
      />
      <p>載入中...</p>
    </div>

    <div v-else-if="error" class="text-center text-red-600">
      <UIcon name="i-heroicons-exclamation-triangle" class="mx-auto h-8 w-8" />
      <p>{{ error }}</p>
    </div>

    <div v-else>
      <!-- 賽事資訊 -->
      <div class="rounded-lg bg-white p-6 shadow">
        <h1 class="mb-4 text-3xl font-bold">{{ game?.name }}</h1>
        <div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <span class="font-medium">比賽日期：</span>
            {{ formatDate(game?.gameDate) }}
          </div>
          <div>
            <span class="font-medium">報名截止：</span>
            {{ formatDate(game?.signupEnd) }}
          </div>
          <div>
            <span class="font-medium">比賽地點：</span>
            {{ game?.location }}
          </div>
          <div>
            <span class="font-medium">主辦單位：</span>
            {{ game?.organizer }}
          </div>
        </div>
      </div>

      <!-- 報名方式選擇 -->
      <div class="rounded-lg bg-white p-6 shadow">
        <h2 class="mb-4 text-2xl font-semibold">選擇報名方式</h2>
        <URadioGroup
          v-model="registrationMode"
          :options="[
            {
              value: 'individual',
              label: '個人報名',
              description: '使用我的隊員直接報名',
            },
            {
              value: 'team',
              label: '隊伍報名',
              description: '代表某個隊伍報名',
            },
          ]"
          class="space-y-3"
        />
      </div>

      <!-- 隊伍選擇 (僅團隊報名) -->
      <div
        v-if="registrationMode === 'team'"
        class="rounded-lg bg-white p-6 shadow"
      >
        <h2 class="mb-4 text-2xl font-semibold">選擇隊伍</h2>
        <div
          v-if="userTeams.length === 0"
          class="py-8 text-center text-gray-500"
        >
          <p>您尚未建立任何隊伍</p>
          <UButton to="/team" class="mt-3"> 建立隊伍 </UButton>
        </div>
        <div v-else>
          <URadioGroup
            v-model="selectedTeamId"
            :options="
              userTeams.map((team) => ({
                value: team.id,
                label: team.name,
                description: `領隊/教練：${getTeamStaffSummary(team)}`,
              }))
            "
            class="space-y-3"
          />
        </div>
      </div>

      <!-- 分類選擇和隊員選擇 -->
      <div
        v-if="gameCategories.length > 0"
        class="rounded-lg bg-white p-6 shadow"
      >
        <h2 class="mb-4 text-2xl font-semibold">選擇參賽分類和隊員</h2>

        <SimpleCategorySelection
          :categories="gameCategories"
          :available-user-players="userPlayers"
          :category-input-methods="categoryInputMethods"
          :selected-players="selectedPlayers"
          :manual-members="manualMembers"
          @update-input-method="updateInputMethod"
          @toggle-player-selection="togglePlayerSelection"
          @update-manual-members="updateManualMembers"
        />
      </div>

      <!-- 備註 -->
      <div class="rounded-lg bg-white p-6 shadow">
        <h2 class="mb-4 text-2xl font-semibold">備註</h2>
        <UTextarea
          v-model="note"
          placeholder="有任何特殊需求或備註，請在此填寫..."
          rows="4"
        />
      </div>

      <!-- 報名摘要 -->
      <div
        v-if="hasSelections"
        class="rounded-lg border border-blue-200 bg-blue-50 p-6"
      >
        <h2 class="mb-4 text-2xl font-semibold text-blue-800">報名摘要</h2>
        <div class="space-y-4">
          <div
            v-for="(participants, categoryId) in getRegistrationSummary()"
            :key="categoryId"
          >
            <div class="font-medium text-blue-700">
              {{ getCategoryName(categoryId) }}
            </div>
            <div class="ml-4 space-y-2">
              <div
                v-for="participant in participants"
                :key="participant.id || participant.name"
                class="text-sm text-gray-700"
              >
                • {{ participant.name }} ({{
                  participant.gender === "M" ? "男" : "女"
                }}, {{ participant.age }}歲)
                <span
                  v-if="participant.isMainPlayer"
                  class="ml-2 rounded bg-blue-100 px-2 py-1 text-xs"
                  >主將</span
                >
              </div>
            </div>
            <div
              v-if="getCategoryFee(categoryId)"
              class="ml-4 text-sm text-gray-600"
            >
              參賽費用：NT$ {{ getCategoryFee(categoryId)?.toLocaleString() }}
            </div>
          </div>

          <div class="border-t pt-4 text-lg font-medium text-blue-800">
            總費用：NT$ {{ getTotalFee().toLocaleString() }}
          </div>
        </div>
      </div>

      <!-- 提交按鈕 -->
      <div class="text-center">
        <UButton
          size="lg"
          :disabled="!hasSelections"
          :loading="submitting"
          @click="submitRegistration"
        >
          提交報名
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Game {
  id: string
  name: string
  gameDate: string
  signupEnd: string
  location: string
  organizer: string
}

interface Category {
  id: string
  gameId: string
  categoryName: string
  conditions?: string | null
  game_fee?: { amount: number }[]
}

interface UserPlayer {
  id: string
  name: string
  gender: "M" | "F"
  birthday: string
}

interface Team {
  id: string
  name: string
  team_staff?: {
    id: string
    name: string
    role: string
  }[]
}

interface ManualMember {
  name: string
  gender: "M" | "F" | ""
  age: string
}

const route = useRoute()
const gameId = route.params.id as string

const { data: session } = await useSession()
if (!session.value) {
  navigateTo("/accounts/login")
}

// 狀態管理
const loading = ref(true)
const error = ref<string | null>(null)
const submitting = ref(false)

// 資料
const game = ref<Game | null>(null)
const gameCategories = ref<Category[]>([])
const userTeams = ref<Team[]>([])
const userPlayers = ref<UserPlayer[]>([])

// 表單狀態
const registrationMode = ref<"individual" | "team">("individual")
const selectedTeamId = ref<string>("")
const note = ref("")

// 分類選擇狀態
const categoryInputMethods = ref<Record<string, "user-players" | "manual">>({})
const selectedPlayers = ref<Record<string, string[]>>({})
const manualMembers = ref<Record<string, ManualMember[]>>({})

/**
 * Load initial data
 */
const loadData = async () => {
  try {
    loading.value = true

    const [gameRes, categoriesRes, teamsRes, playersRes] =
      await Promise.allSettled([
        $fetch(`/api/games/${gameId}`),
        $fetch(`/api/game_category?gameId=${gameId}`),
        $fetch("/api/team"),
        $fetch("/api/user_player"),
      ])

    if (gameRes.status === "fulfilled") {
      game.value = gameRes.value.data
    }

    if (categoriesRes.status === "fulfilled") {
      gameCategories.value = categoriesRes.value.data || []
    }

    if (teamsRes.status === "fulfilled") {
      userTeams.value = teamsRes.value.data || []
    }

    if (playersRes.status === "fulfilled") {
      userPlayers.value = playersRes.value.data || []
    }

    // 初始化分類輸入方式
    gameCategories.value.forEach((category) => {
      categoryInputMethods.value[category.id] = "user-players"
    })
  } catch (err) {
    error.value = "載入資料失敗"
    console.error("Load data error:", err)
  } finally {
    loading.value = false
  }
}

/**
 * Format date
 */
const formatDate = (dateString?: string) => {
  if (!dateString) return "-"
  return new Date(dateString).toLocaleDateString("zh-TW")
}

/**
 * Get team staff summary
 */
const getTeamStaffSummary = (team: Team): string => {
  const staff = team.team_staff || []
  if (staff.length === 0) return "無"
  return staff.map((s) => `${s.name}(${s.role})`).join(", ")
}

/**
 * Update input method for category
 */
const updateInputMethod = (
  categoryId: string,
  method: "user-players" | "manual",
) => {
  categoryInputMethods.value[categoryId] = method

  // 清除其他方式的資料
  if (method === "user-players") {
    delete manualMembers.value[categoryId]
  } else {
    delete selectedPlayers.value[categoryId]
  }
}

/**
 * Toggle player selection
 */
const togglePlayerSelection = (
  categoryId: string,
  playerId: string,
  selected: boolean,
) => {
  if (!selectedPlayers.value[categoryId]) {
    selectedPlayers.value[categoryId] = []
  }

  if (selected) {
    if (!selectedPlayers.value[categoryId].includes(playerId)) {
      selectedPlayers.value[categoryId].push(playerId)
    }
  } else {
    selectedPlayers.value[categoryId] = selectedPlayers.value[
      categoryId
    ].filter((id) => id !== playerId)
  }
}

/**
 * Update manual members
 */
const updateManualMembers = (categoryId: string, members: ManualMember[]) => {
  manualMembers.value[categoryId] = members
}

/**
 * Check if there are any selections
 */
const hasSelections = computed(() => {
  const hasUserPlayers = Object.values(selectedPlayers.value).some(
    (players) => players.length > 0,
  )
  const hasManualMembers = Object.values(manualMembers.value).some((members) =>
    members.some((m) => m.name && m.gender && m.age),
  )
  return hasUserPlayers || hasManualMembers
})

/**
 * Get category name by ID
 */
const getCategoryName = (categoryId: string): string => {
  const category = gameCategories.value.find((c) => c.id === categoryId)
  return category?.categoryName || "未知分類"
}

/**
 * Get category fee
 */
const getCategoryFee = (categoryId: string): number | null => {
  const category = gameCategories.value.find((c) => c.id === categoryId)
  return category?.game_fee?.[0]?.amount || null
}

/**
 * Get total fee
 */
const getTotalFee = (): number => {
  let total = 0

  Object.keys(selectedPlayers.value).forEach((categoryId) => {
    if (selectedPlayers.value[categoryId]?.length > 0) {
      const fee = getCategoryFee(categoryId)
      if (fee) total += fee
    }
  })

  Object.keys(manualMembers.value).forEach((categoryId) => {
    const members = manualMembers.value[categoryId] || []
    if (members.some((m) => m.name && m.gender && m.age)) {
      const fee = getCategoryFee(categoryId)
      if (fee) total += fee
    }
  })

  return total
}

/**
 * Get registration summary
 */
const getRegistrationSummary = () => {
  const summary: Record<string, any[]> = {}

  // 使用者隊員
  Object.entries(selectedPlayers.value).forEach(([categoryId, playerIds]) => {
    if (playerIds.length > 0) {
      summary[categoryId] = playerIds
        .map((playerId, index) => {
          const player = userPlayers.value.find((p) => p.id === playerId)
          if (!player) return null

          const age =
            new Date().getFullYear() - new Date(player.birthday).getFullYear()
          return {
            id: playerId,
            name: player.name,
            gender: player.gender,
            age,
            isMainPlayer: index === 0,
          }
        })
        .filter(Boolean)
    }
  })

  // 手動輸入隊員
  Object.entries(manualMembers.value).forEach(([categoryId, members]) => {
    const validMembers = members.filter((m) => m.name && m.gender && m.age)
    if (validMembers.length > 0) {
      if (!summary[categoryId]) summary[categoryId] = []

      validMembers.forEach((member, index) => {
        summary[categoryId].push({
          name: member.name,
          gender: member.gender,
          age: parseInt(member.age),
          isMainPlayer: summary[categoryId].length === 0 && index === 0,
        })
      })
    }
  })

  return summary
}

/**
 * Submit registration
 */
const submitRegistration = async () => {
  if (!hasSelections.value) return

  submitting.value = true
  try {
    const summary = getRegistrationSummary()

    // 為每個分類建立報名
    for (const [categoryId, participants] of Object.entries(summary)) {
      const participantData = participants.map((p) => {
        if (p.id) {
          // 使用者隊員
          return {
            userPlayerId: p.id,
            isMainPlayer: p.isMainPlayer,
          }
        } else {
          // 手動輸入隊員
          return {
            name: p.name,
            gender: p.gender,
            age: p.age,
            isMainPlayer: p.isMainPlayer,
          }
        }
      })

      await $fetch(`/api/games/${gameId}/signup`, {
        method: "POST",
        body: {
          categoryId,
          teamId:
            registrationMode.value === "team" ? selectedTeamId.value : null,
          participants: participantData,
          note: note.value || null,
        },
      })
    }

    // 報名成功，跳轉到成功頁面
    navigateTo(`/games/${gameId}?registered=true`)
  } catch (err: any) {
    console.error("Submit registration error:", err)
    error.value = err.data?.message || "報名失敗，請稍後再試"
  } finally {
    submitting.value = false
  }
}

// 載入資料
onMounted(() => {
  loadData()
})
</script>
