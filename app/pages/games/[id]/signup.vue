<script setup lang="ts">
interface TeamMember {
  id?: string
  name: string
  role: string
  gender: string | undefined
  birthday?: string | null
  phone?: string | null
  email?: string | null
}

interface TeamMemberFromAPI {
  id: string
  name: string
  role: string
  gender: "M" | "F"
  birthday: string
  phone?: string | null
  email?: string | null
}

interface FormData {
  teamName: string
  leader: TeamMember
  coach: TeamMember
  categoryMembers: Record<string, TeamMember[]>
  selectedTeamId?: string
  selectedCategoryId?: string
  note?: string
}

const route = useRoute()
const gameId = route.params.id as string

// 初始化狀態
interface Category {
  id: string
  gameId: string
  type: string
  group: string
  level?: string | null
  weightClass?: string | null
  fullName: string
  createdAt: string
  updatedAt: string
  game_fee?: { amount: number; categoryId?: string }[]
}
interface Team {
  id: string
  name: string
  team_member?: TeamMemberFromAPI[]
}
const game = ref<Record<string, unknown> | null>(null)
const categories = ref<Category[]>([])
const userTeams = ref<Team[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)

// 載入資料 - 使用 onMounted 而不是 top-level await
onMounted(async () => {
  try {
    // 先設置一些測試資料以確保頁面能顯示
    game.value = { name: "測試賽事" }
    categories.value = [
      {
        id: "1",
        gameId: gameId,
        type: "品勢",
        group: "男子組",
        level: "高級",
        weightClass: null,
        fullName: "品勢-男子組-高級",
        createdAt: "",
        updatedAt: "",
        game_fee: [{ amount: 1000 }],
      },
      {
        id: "2",
        gameId: gameId,
        type: "對打",
        group: "女子組",
        level: null,
        weightClass: "50公斤級",
        fullName: "對打-女子組-50公斤級",
        createdAt: "",
        updatedAt: "",
        game_fee: [{ amount: 1000 }],
      },
    ]

    // 嘗試載入真實資料
    const [gameResponse, categoriesResponse, teamsResponse] =
      await Promise.allSettled([
        $fetch(`/api/games/${gameId}`),
        $fetch(`/api/game_category`, { query: { gameId } }),
        $fetch("/api/team"),
      ])

    if (gameResponse.status === "fulfilled") {
      const gval = gameResponse.value as unknown
      game.value =
        gval && typeof gval === "object" && "data" in gval
          ? (gval as { data: Record<string, unknown> }).data
          : (gval as Record<string, unknown>)
    }

    if (categoriesResponse.status === "fulfilled") {
      const cval = categoriesResponse.value as unknown
      const catVal =
        cval && typeof cval === "object" && "data" in cval
          ? (cval as { data: Category[] }).data
          : (cval as Category[])
      categories.value = Array.isArray(catVal) ? catVal : categories.value
    }

    if (teamsResponse.status === "fulfilled") {
      const tval = teamsResponse.value as unknown
      const teamVal =
        tval && typeof tval === "object" && "data" in tval
          ? (tval as { data: Team[] }).data
          : (tval as Team[])
      userTeams.value = Array.isArray(teamVal) ? teamVal : []
    }
  } catch (e) {
    console.error("載入失敗:", e)
    // 即使失敗也顯示測試資料
  } finally {
    isLoading.value = false
  }
})

// 表單資料
const formData = ref<FormData>({
  teamName: "",
  leader: {
    name: "",
    role: "領隊",
    gender: undefined,
    birthday: "",
    phone: "",
    email: "",
  },
  coach: {
    name: "",
    role: "教練",
    gender: undefined,
    birthday: "",
    phone: "",
    email: "",
  },
  categoryMembers: {},
  selectedTeamId: "",
  selectedCategoryId: "",
  note: "",
})

// UI 狀態
const isSubmitting = ref(false)

// 組別選項：填寫方式選擇（隊員/手動輸入）
const categoryInputMethods = ref<Record<string, "team-members" | "manual">>({})

// 初始化類別成員和輸入方式
watchEffect(() => {
  if (categories.value?.length) {
    categories.value.forEach((category) => {
      if (!formData.value.categoryMembers[category.id]) {
        formData.value.categoryMembers[category.id] = []
      }
      if (!categoryInputMethods.value[category.id]) {
        categoryInputMethods.value[category.id] = "team-members"
      }
    })
  }
})

// 當選擇手動輸入隊伍時，強制所有組別為手動輸入
watch(
  () => formData.value.selectedTeamId,
  (teamId) => {
    if (teamId === "custom") {
      // 強制所有組別為手動輸入
      Object.keys(categoryInputMethods.value).forEach((categoryId) => {
        categoryInputMethods.value[categoryId] = "manual"
      })
    }
  },
)

// 組織分類資料結構
const organizedCategories = computed(() => {
  if (!categories.value?.length) return {}

  const organized: Record<string, Record<string, Record<string, Category>>> = {}

  categories.value
    .filter((cat) => cat.gameId === gameId)
    .forEach((category) => {
      const { type, group, level, weightClass } = category

      if (!organized[type]) {
        organized[type] = {}
      }
      if (!organized[type][group]) {
        organized[type][group] = {}
      }

      // 使用level或weightClass作為第三層key
      const thirdLevelKey = level || weightClass || "default"
      organized[type][group][thirdLevelKey] = category
    })

  return organized
})

// 取得隊伍成員選項（排除領隊和教練）
const getTeamMemberOptions = computed(() => {
  if (
    !formData.value.selectedTeamId ||
    formData.value.selectedTeamId === "custom"
  ) {
    return []
  }

  const selectedTeam = userTeams.value.find(
    (team) => team.id === formData.value.selectedTeamId,
  )
  if (!selectedTeam?.team_member) return []

  return selectedTeam.team_member
    .filter((member) => member.role !== "領隊" && member.role !== "教練")
    .map((member) => ({
      id: member.id,
      name: member.name || "",
      role: member.role || "選手",
      gender:
        member.gender === "M"
          ? "male"
          : member.gender === "F"
            ? "female"
            : undefined,
      birthday: member.birthday
        ? new Date(member.birthday).toISOString().split("T")[0]
        : "",
      phone: member.phone || "",
      email: member.email || "",
    }))
})

// 根據組別篩選隊員（性別限制）
const getFilteredTeamMemberOptions = (categoryId: string) => {
  const category = categories.value?.find((cat) => cat.id === categoryId)
  if (!category) return getTeamMemberOptions.value

  const allMembers = getTeamMemberOptions.value

  // 雙人品勢不限性別
  if (category.type === "品勢" && category.group.includes("雙人")) {
    console.log(`組別 ${category.fullName} 為雙人品勢，不限性別`)
    return allMembers
  }

  // 混合組或不限性別的組別
  if (category.group.includes("混合") || category.group.includes("不限")) {
    console.log(`組別 ${category.fullName} 為混合組，不限性別`)
    return allMembers
  }

  // 其他組別需要性別篩選
  if (
    category.group.includes("男子組") ||
    category.group.includes("男生組") ||
    category.group.includes("男組")
  ) {
    const filteredMembers = allMembers.filter(
      (member) => member.gender === "male",
    )
    console.log(
      `組別 ${category.fullName} 限男性，篩選出 ${filteredMembers.length}/${allMembers.length} 位隊員`,
    )
    return filteredMembers
  } else if (
    category.group.includes("女子組") ||
    category.group.includes("女生組") ||
    category.group.includes("女組")
  ) {
    const filteredMembers = allMembers.filter(
      (member) => member.gender === "female",
    )
    console.log(
      `組別 ${category.fullName} 限女性，篩選出 ${filteredMembers.length}/${allMembers.length} 位隊員`,
    )
    return filteredMembers
  }

  // 如果組別名稱不明確，回傳所有隊員
  console.log(`組別 ${category.fullName} 組別名稱不明確，不篩選性別`)
  return allMembers
}

// 選擇隊伍後自動匯入隊伍名稱、領隊、教練資料，若選手動輸入則清空
watch(
  () => formData.value.selectedTeamId,
  async (teamId) => {
    if (!teamId) return
    if (teamId === "custom") {
      formData.value.teamName = ""
      formData.value.leader = {
        name: "",
        role: "領隊",
        gender: undefined,
        birthday: "",
        phone: "",
        email: "",
      }
      formData.value.coach = {
        name: "",
        role: "教練",
        gender: undefined,
        birthday: "",
        phone: "",
        email: "",
      }
      return
    }
    try {
      const response = await $fetch(`/api/team/${teamId}`)
      const team = response && typeof response === "object" ? response : null
      if (team) {
        formData.value.teamName = team.name
        if (Array.isArray(team.team_member)) {
          // 先重置領隊和教練資料
          formData.value.leader = {
            name: "",
            role: "領隊",
            gender: undefined,
            birthday: "",
            phone: "",
            email: "",
          }
          formData.value.coach = {
            name: "",
            role: "教練",
            gender: undefined,
            birthday: "",
            phone: "",
            email: "",
          }

          // 找到領隊和教練並完整複製所有欄位
          team.team_member.forEach((member: TeamMemberFromAPI) => {
            if (member.role === "領隊") {
              formData.value.leader = {
                id: member.id,
                name: member.name || "",
                role: "領隊",
                gender:
                  member.gender === "M"
                    ? "male"
                    : member.gender === "F"
                      ? "female"
                      : undefined,
                birthday: member.birthday
                  ? new Date(member.birthday).toISOString().split("T")[0]
                  : "",
                phone: member.phone || "",
                email: member.email || "",
              }
            } else if (member.role === "教練") {
              formData.value.coach = {
                id: member.id,
                name: member.name || "",
                role: "教練",
                gender:
                  member.gender === "M"
                    ? "male"
                    : member.gender === "F"
                      ? "female"
                      : undefined,
                birthday: member.birthday
                  ? new Date(member.birthday).toISOString().split("T")[0]
                  : "",
                phone: member.phone || "",
                email: member.email || "",
              }
            }
          })
        }
      }
    } catch (err) {
      console.error("匯入隊伍資料失敗:", err)
    }
  },
  { immediate: false },
)

// 計算費用
const calculateFee = computed(() => {
  let totalFee = 0
  categories.value?.forEach((category) => {
    const memberCount = formData.value.categoryMembers[category.id]?.length || 0
    if (memberCount > 0 && Array.isArray(category.game_fee)) {
      category.game_fee.forEach((fee) => {
        totalFee += (fee.amount || 0) * memberCount
      })
    }
  })
  return totalFee
})

// 檢查表單是否可以提交
const canSubmit = computed(() => {
  // 檢查基本資料
  if (!formData.value.teamName.trim()) return false
  if (!formData.value.leader.name.trim()) return false
  if (!formData.value.leader.gender) return false
  if (!formData.value.coach.name.trim()) return false
  if (!formData.value.coach.gender) return false

  // 檢查是否有任何參賽隊員
  const hasParticipants = Object.values(formData.value.categoryMembers).some(
    (members) => members.length > 0,
  )

  if (!hasParticipants) return false

  // 檢查所有隊員的必填欄位
  for (const members of Object.values(formData.value.categoryMembers)) {
    if (members.length > 0) {
      for (const member of members) {
        if (!member.name?.trim()) return false
        if (!member.gender) return false
      }
    }
  }

  return true
})

// 切換隊員選擇
const toggleTeamMember = (categoryId: string, member: TeamMember) => {
  if (!formData.value.categoryMembers[categoryId]) {
    formData.value.categoryMembers[categoryId] = []
  }

  const members = formData.value.categoryMembers[categoryId]
  const existingIndex = members.findIndex((m) => m.id === member.id)

  if (existingIndex > -1) {
    // 移除隊員
    members.splice(existingIndex, 1)
  } else {
    // 新增隊員
    members.push({ ...member })
  }
}

// 新增手動輸入隊員
const addCategoryMember = (categoryId: string) => {
  if (!formData.value.categoryMembers[categoryId]) {
    formData.value.categoryMembers[categoryId] = []
  }

  formData.value.categoryMembers[categoryId].push({
    name: "",
    role: "選手",
    gender: undefined,
    birthday: "",
    phone: "",
    email: "",
  })
}

// 移除手動輸入隊員
const removeCategoryMember = (categoryId: string, index: number) => {
  if (formData.value.categoryMembers[categoryId]) {
    formData.value.categoryMembers[categoryId].splice(index, 1)
  }
}

// 更新輸入方式
const updateInputMethod = (
  categoryId: string,
  method: "team-members" | "manual",
) => {
  categoryInputMethods.value[categoryId] = method
}

// 提交報名
const submitRegistration = async () => {
  if (isSubmitting.value) return

  try {
    isSubmitting.value = true

    // 收集所有未填的必填欄位
    const missingFields: string[] = []

    // 驗證必要欄位
    if (!formData.value.teamName.trim()) {
      missingFields.push("隊伍名稱")
    }

    if (!formData.value.leader.name.trim()) {
      missingFields.push("領隊姓名")
    }

    if (!formData.value.leader.gender) {
      missingFields.push("領隊性別")
    }

    if (!formData.value.coach.name.trim()) {
      missingFields.push("教練姓名")
    }

    if (!formData.value.coach.gender) {
      missingFields.push("教練性別")
    }

    // 檢查是否有選擇任何組別的隊員
    const hasAnyParticipants = Object.values(
      formData.value.categoryMembers,
    ).some((members) => members.length > 0)

    if (!hasAnyParticipants) {
      missingFields.push("參賽隊員（至少一個組別需要添加隊員）")
    }

    // 驗證所有隊員資料完整性
    for (const [categoryId, members] of Object.entries(
      formData.value.categoryMembers,
    )) {
      if (members.length > 0) {
        const category = categories.value?.find((cat) => cat.id === categoryId)
        const categoryName = category?.fullName || "未知組別"

        for (let i = 0; i < members.length; i++) {
          const member = members[i]
          if (!member.name?.trim()) {
            missingFields.push(`${categoryName} - 第${i + 1}位隊員姓名`)
          }
          if (!member.gender) {
            missingFields.push(`${categoryName} - 第${i + 1}位隊員性別`)
          }
        }
      }
    }

    // 如果有未填欄位，顯示詳細錯誤訊息
    if (missingFields.length > 0) {
      const toast = useToast()
      toast.add({
        title: "請填寫以下必填欄位",
        description: missingFields.join("、"),
        color: "red",
        duration: 8000,
      })
      return
    }

    // 為每個有隊員的組別分別提交報名
    const registrationPromises = []
    let createdTeamId = null

    for (const [categoryId, members] of Object.entries(
      formData.value.categoryMembers,
    )) {
      if (members.length > 0) {
        // 如果是手動輸入或選擇隊伍為 custom，需要先創建/更新隊伍和隊員
        if (
          formData.value.selectedTeamId === "custom" ||
          categoryInputMethods.value[categoryId] === "manual"
        ) {
          let teamId = formData.value.selectedTeamId

          // 如果是新建隊伍且尚未創建
          if (formData.value.selectedTeamId === "custom" && !createdTeamId) {
            const teamResponse = await $fetch("/api/team", {
              method: "POST",
              body: { name: formData.value.teamName },
            })
            createdTeamId = teamResponse.data?.id
            teamId = createdTeamId

            // 先創建領隊和教練（只創建一次）
            await $fetch("/api/team_member/batch", {
              method: "POST",
              body: {
                teamId,
                members: [formData.value.leader, formData.value.coach].map(
                  (member) => ({
                    name: member.name,
                    role: member.role,
                    gender: member.gender === "male" ? "M" : "F",
                    birthday: member.birthday || null,
                    phone: member.phone || null,
                    email: member.email || null,
                  }),
                ),
              },
            })
          } else if (formData.value.selectedTeamId === "custom") {
            teamId = createdTeamId
          }

          // 為該組別新增參賽隊員
          const membersResponse = await $fetch("/api/team_member/batch", {
            method: "POST",
            body: {
              teamId,
              members: members.map((member) => ({
                name: member.name,
                role: member.role,
                gender: member.gender === "male" ? "M" : "F",
                birthday: member.birthday || null,
                phone: member.phone || null,
                email: member.email || null,
              })),
            },
          })

          // 獲取參賽隊員的 ID
          const participantIds = membersResponse.data?.map(
            (member: { id: string }) => member.id,
          )

          registrationPromises.push(
            $fetch(`/api/games/${gameId}/signup`, {
              method: "POST",
              body: {
                categoryId,
                teamId,
                participants: participantIds,
                note: formData.value.note,
              },
            }),
          )
        } else {
          // 使用現有隊伍，直接使用隊員 ID
          const memberIds = members.map((member) => member.id).filter(Boolean)

          registrationPromises.push(
            $fetch(`/api/games/${gameId}/signup`, {
              method: "POST",
              body: {
                categoryId,
                teamId: formData.value.selectedTeamId,
                participants: memberIds,
                note: formData.value.note,
              },
            }),
          )
        }
      }
    }

    // 等待所有報名完成
    await Promise.all(registrationPromises)

    // 報名成功，跳轉到確認頁面
    const toast = useToast()
    toast.add({
      title: "報名成功！",
      description: "您的報名已提交，請等待審核",
      color: "green",
      timeout: 5000,
    })

    await navigateTo(`/games/${gameId}`)
  } catch (err) {
    console.error("報名失敗:", err)
    // 使用 toast 顯示錯誤訊息
    const toast = useToast()

    if (err instanceof Error) {
      toast.add({
        title: "報名失敗",
        description: err.message,
        color: "red",
        timeout: 6000,
      })
    } else {
      toast.add({
        title: "報名失敗",
        description: "系統發生錯誤，請稍後再試",
        color: "red",
        timeout: 6000,
      })
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen">
    <UContainer class="py-8">
      <!-- 載入狀態 -->
      <div
        v-if="isLoading"
        class="flex min-h-[400px] items-center justify-center"
      >
        <div class="text-center">
          <div
            class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
          ></div>
          <p>載入中...</p>
        </div>
      </div>

      <!-- 錯誤狀態 -->
      <div v-else-if="error" class="py-12 text-center">
        <div class="mx-auto max-w-md rounded-lg border p-6">
          <h2 class="mb-2 font-semibold">載入失敗</h2>
          <p>{{ error }}</p>
          <UButton class="mt-4" @click="$router.go(0)">重新載入</UButton>
        </div>
      </div>

      <!-- 主要內容 -->
      <div v-else>
        <div class="mb-8">
          <h1 class="text-3xl font-bold">賽事報名</h1>
          <p class="mt-2">{{ game?.name || "未知賽事" }}</p>
        </div>

        <div class="grid gap-8 lg:grid-cols-3">
          <!-- 左側：報名表單 -->
          <div class="lg:col-span-2">
            <UCard class="p-6">
              <!-- 隊伍選擇（手動填入選項） -->
              <div class="mb-6">
                <h3 class="mb-3 text-lg font-medium">選擇隊伍</h3>
                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <USelect
                    v-model="formData.selectedTeamId"
                    :items="[
                      { label: '手動輸入', value: 'custom' },
                      ...(userTeams
                        ? userTeams.map((team) => ({
                            label: team.name,
                            value: team.id,
                          }))
                        : []),
                    ]"
                    placeholder="請選擇隊伍"
                  />
                </div>
              </div>

              <!-- 隊伍名稱 -->
              <div class="mb-6">
                <h3 class="mb-3 text-lg font-medium">
                  隊伍名稱 <span class="text-red-500">*</span>
                </h3>
                <UInput
                  v-model="formData.teamName"
                  placeholder="請輸入隊伍名稱 *"
                  size="lg"
                  required
                />
              </div>

              <!-- 領隊資料 -->
              <div class="mb-6">
                <h3 class="mb-3 text-lg font-medium">
                  領隊資料 <span class="text-red-500">*</span>
                </h3>
                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <UInput
                    v-model="formData.leader.name"
                    placeholder="領隊姓名 *"
                    required
                  />
                  <USelect
                    v-model="formData.leader.gender"
                    :items="[
                      { label: '男', value: 'male' },
                      { label: '女', value: 'female' },
                    ]"
                    placeholder="性別 *"
                    required
                  />
                  <UInput
                    v-model="formData.leader.phone"
                    placeholder="聯絡電話"
                  />
                  <UInput
                    v-model="formData.leader.email"
                    placeholder="電子信箱"
                    type="email"
                  />
                  <UInput
                    v-model="formData.leader.birthday"
                    placeholder="生日"
                    type="date"
                  />
                </div>
              </div>

              <!-- 教練資料 -->
              <div class="mb-6">
                <h3 class="mb-3 text-lg font-medium">
                  教練資料 <span class="text-red-500">*</span>
                </h3>
                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <UInput
                    v-model="formData.coach.name"
                    placeholder="教練姓名 *"
                    required
                  />
                  <USelect
                    v-model="formData.coach.gender"
                    :items="[
                      { label: '男', value: 'male' },
                      { label: '女', value: 'female' },
                    ]"
                    placeholder="性別 *"
                    required
                  />
                  <UInput
                    v-model="formData.coach.phone"
                    placeholder="聯絡電話"
                  />
                  <UInput
                    v-model="formData.coach.email"
                    placeholder="電子信箱"
                    type="email"
                  />
                  <UInput
                    v-model="formData.coach.birthday"
                    placeholder="生日"
                    type="date"
                  />
                </div>
              </div>

              <!-- 組別選擇（嵌套展開/收合） -->
              <div class="mb-6">
                <h3 class="mb-3 text-lg font-medium">
                  參賽組別 <span class="text-red-500">*</span>
                </h3>
                <p class="mb-3 text-sm text-gray-600">
                  請至少選擇一個組別並添加參賽隊員
                </p>
                <div
                  v-if="Object.keys(organizedCategories).length > 0"
                  class="space-y-4"
                >
                  <category-selection
                    :organized-categories="organizedCategories"
                    :category-input-methods="categoryInputMethods"
                    :form-data="formData"
                    :get-filtered-team-member-options="
                      getFilteredTeamMemberOptions
                    "
                    @toggle-team-member="toggleTeamMember"
                    @add-category-member="addCategoryMember"
                    @remove-category-member="removeCategoryMember"
                    @update-input-method="updateInputMethod"
                  />
                </div>
                <div v-else class="py-8 text-center">
                  <p>此賽事尚未設定組別</p>
                </div>
              </div>

              <!-- 備註 -->
              <div class="mb-6">
                <h3 class="mb-3 text-lg font-medium">備註</h3>
                <UTextarea
                  v-model="formData.note"
                  placeholder="如有需要，請輸入備註事項"
                />
              </div>

              <!-- 提交按鈕 -->
              <div class="flex justify-end">
                <UButton
                  size="lg"
                  :loading="isSubmitting"
                  :disabled="!canSubmit"
                  @click="submitRegistration"
                >
                  確認報名
                </UButton>
              </div>
            </UCard>
          </div>

          <!-- 右側：費用試算 -->
          <div class="lg:col-span-1">
            <div class="sticky top-8">
              <UCard class="p-6">
                <h3 class="mb-4 text-xl font-semibold">費用試算</h3>

                <div class="space-y-4">
                  <!-- 各組別費用明細 -->
                  <div
                    v-for="category in categories.filter(
                      (cat) =>
                        (formData.categoryMembers[cat.id]?.length || 0) > 0,
                    )"
                    :key="category.id"
                    class="border-b pb-3 last:border-b-0"
                  >
                    <div class="flex items-center justify-between">
                      <span class="text-sm">{{ category.fullName }}</span>
                      <div class="text-right">
                        <div class="text-sm">
                          {{
                            formData.categoryMembers[category.id]?.length || 0
                          }}
                          人
                        </div>
                        <div class="font-medium">
                          NT$
                          {{
                            (
                              (formData.categoryMembers[category.id]?.length ||
                                0) * (category.game_fee?.[0]?.amount || 0)
                            ).toLocaleString()
                          }}
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 總計 -->
                  <div class="pt-3">
                    <div
                      class="flex items-center justify-between text-lg font-bold"
                    >
                      <span>總計</span>
                      <span>NT$ {{ calculateFee.toLocaleString() }}</span>
                    </div>
                  </div>

                  <!-- 報名須知 -->
                  <div class="mt-6 rounded-lg p-4">
                    <h4 class="mb-2 font-medium">報名須知</h4>
                    <ul class="space-y-1 text-sm">
                      <li>• 報名費用需於指定時間內完成繳費</li>
                      <li>• 參賽者需自備運動用品</li>
                      <li>• 報名後如需更改資料請聯繫主辦單位</li>
                    </ul>
                  </div>

                  <!-- 提交按鈕 -->
                  <UButton
                    :loading="isSubmitting"
                    :disabled="!canSubmit"
                    block
                    size="lg"
                    class="mt-6"
                    @click="submitRegistration"
                  >
                    提交報名
                  </UButton>
                </div>
              </UCard>
            </div>
          </div>
        </div>
      </div>
    </UContainer>
  </div>
</template>
