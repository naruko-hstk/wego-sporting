<script setup lang="ts">
import { z } from "zod"
import type { FormSubmitEvent } from "@nuxt/ui"
import type { Team, TeamMember } from "~/types/game"
import { CalendarDate } from "@internationalized/date"

const route = useRoute()
const router = useRouter()
const toast = useToast()
const teamId = route.params.id as string

// 獲取隊伍和成員資料
const {
  data: team,
  pending,
  error,
  refresh,
} = await useFetch<Team>(`/api/team/${teamId}`, {
  headers: useRequestHeaders(["cookie"]),
  server: false,
  retry: 2,
  retryDelay: 500,
})

// 當加載完成且有錯誤時才顯示 404
const showNotFound = computed(
  () => !pending.value && (error.value || !team.value),
)

// 成員列表（反應式）
const members = ref<TeamMember[]>([])

// 監聽 team 數據變化並更新 members
watch(
  team,
  (newTeam) => {
    if (newTeam?.team_member) {
      members.value = newTeam.team_member
    }
  },
  { immediate: true },
)

// Modal 狀態
const isModalOpen = ref(false)
const isEditing = ref(false)
const editingMember = ref<TeamMember | null>(null)

const emailSchema = z.preprocess(
  (val) => {
    if (typeof val === "string" && val.trim() === "") {
      return undefined
    }
    return val
  },
  z.email({ message: "Email 格式錯誤" }).optional(),
)

// Zod 驗證 schema
const memberSchema = z.object({
  name: z.string().min(1, "姓名不能為空").max(50, "姓名不能超過50字"),
  role: z.string().min(1, "角色不能為空").max(50, "角色不能超過50字"),
  gender: z.enum(["M", "F"], { message: "請選擇性別" }),
  birthday: z.string().min(1, "請選擇生日"),
  phone: z.string().optional(),
  email: emailSchema,
})

type MemberSchema = z.output<typeof memberSchema>

// 表單狀態
const state = reactive<Partial<MemberSchema>>({
  name: "",
  role: "",
  gender: undefined,
  birthday: "",
  phone: "",
  email: "",
})

// 生日日曆狀態
const birthdayCalendar = ref(null)

// 監聽生日日曆變化，同步到表單狀態
watch(birthdayCalendar, (newDate) => {
  if (newDate && typeof newDate === "object" && "toDate" in newDate) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const date = (newDate as any).toDate("UTC")
    state.birthday = date.toISOString().split("T")[0]
  } else {
    state.birthday = ""
  }
})

// 清除表單
const clearForm = () => {
  Object.assign(state, {
    name: "",
    role: "",
    gender: undefined,
    birthday: "",
    phone: "",
    email: undefined,
  })
  birthdayCalendar.value = null
}

const openAddModal = () => {
  isEditing.value = false
  editingMember.value = null
  clearForm()
  isModalOpen.value = true
}

const openEditModal = (member: TeamMember) => {
  isEditing.value = true
  editingMember.value = { ...member }

  // 填入表單數據
  Object.assign(state, {
    name: member.name,
    role: member.role,
    gender: member.gender as "M" | "F",
    birthday: member.birthday
      ? new Date(member.birthday).toISOString().split("T")[0]
      : "",
    phone: member.phone || "",
    email: member.email || "",
  })

  // 設置生日日曆
  if (member.birthday) {
    const date = new Date(member.birthday)
    // @ts-expect-error CalendarDate type issue
    birthdayCalendar.value = new CalendarDate(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
    )
  } else {
    birthdayCalendar.value = null
  }

  isModalOpen.value = true
}

// 提交表單
const onSubmit = async (event: FormSubmitEvent<MemberSchema>) => {
  try {
    if (isEditing.value && editingMember.value) {
      // 更新成員
      const data = await $fetch<{ success: boolean; data: TeamMember }>(
        `/api/team_member/${editingMember.value.id}`,
        {
          method: "PUT",
          body: event.data,
        },
      )

      // 更新本地資料
      const index = members.value.findIndex(
        (m) => m.id === editingMember.value!.id,
      )
      if (index !== -1) {
        members.value[index] = { ...data.data }
      }

      toast.add({ title: "成員更新成功" })
    } else {
      // 新增成員
      const data = await $fetch<{ success: boolean; data: TeamMember }>(
        "/api/team_member",
        {
          method: "POST",
          body: {
            ...event.data,
            teamId: team.value?.id,
          },
        },
      )

      // 加入本地資料
      members.value.push(data.data)

      toast.add({ title: "成員新增成功" })
    }

    isModalOpen.value = false
    clearForm()
  } catch (error: unknown) {
    console.error("表單提交錯誤:", error)
    toast.add({
      title: "操作失敗",
      description:
        (error as { data?: { message?: string } })?.data?.message ||
        "請稍後再試",
      color: "error",
    })
  }
}

// 刪除成員
const deleteMember = async (member: TeamMember) => {
  if (!confirm(`確定要刪除成員「${member.name}」嗎？`)) {
    return
  }

  try {
    await $fetch(`/api/team_member/${member.id}`, {
      method: "DELETE",
    })

    // 從本地資料中移除
    const index = members.value.findIndex((m) => m.id === member.id)
    if (index !== -1) {
      members.value.splice(index, 1)
    }

    toast.add({ title: "成員刪除成功" })
  } catch (error: unknown) {
    console.error("刪除成員錯誤:", error)
    toast.add({
      title: "刪除失敗",
      description:
        (error as { data?: { message?: string } })?.data?.message ||
        "請稍後再試",
      color: "error",
    })
  }
}

// 成員管理狀態 (保持向後兼容)
const isAddingMember = computed(() => isModalOpen.value)
const selectedMember = computed(() => editingMember.value)

const handleAddMember = openAddModal
const handleEditMember = openEditModal
const handleCloseModal = () => {
  isModalOpen.value = false
  clearForm()
}

// 表單 ref
const memberForm = useTemplateRef("memberForm")

// 觸發表單提交
const submitMemberForm = () => {
  memberForm.value?.submit()
}
</script>

<template>
  <div>
    <!-- Loading 狀態 -->
    <div v-if="pending" class="space-y-6">
      <USkeleton class="h-20 w-full" />
      <USkeleton class="h-64 w-full" />
    </div>

    <!-- 正常內容 -->
    <div v-else-if="team">
      <UPageHeader class="mb-8">
        <template #title>{{ team.name }} - 成員管理</template>

        <template #description>管理隊伍成員資訊</template>

        <template #links>
          <UButton
            icon="i-lucide-arrow-left"
            variant="ghost"
            @click="router.push(`/team/${teamId}`)"
          >
            返回隊伍詳細
          </UButton>
        </template>
      </UPageHeader>

      <UPageGrid>
        <UPageCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-semibold">
                隊伍成員 ({{ members.length }} 人)
              </h2>
              <UButton
                icon="i-lucide-plus"
                class="ml-4"
                @click="handleAddMember"
              >
                新增成員
              </UButton>
            </div>
          </template>

          <div class="space-y-4">
            <!-- 成員列表 -->
            <div v-if="members.length > 0" class="grid gap-4">
              <div
                v-for="member in members"
                :key="member.id"
                class="flex items-center justify-between rounded-lg border p-4 dark:border-gray-700"
              >
                <div class="flex items-center gap-4">
                  <UAvatar :alt="member.name" size="md" />
                  <div>
                    <h3 class="font-semibold">{{ member.name }}</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      {{ member.role }}
                    </p>
                    <div class="mt-1 flex gap-3 text-xs text-gray-400">
                      <span>{{ member.gender === "M" ? "男" : "女" }}</span>
                      <span v-if="member.phone">{{ member.phone }}</span>
                      <span v-if="member.email">{{ member.email }}</span>
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <UButton
                    icon="i-lucide-edit"
                    size="sm"
                    variant="outline"
                    @click="handleEditMember(member)"
                  >
                    編輯
                  </UButton>
                  <UButton
                    icon="i-lucide-trash"
                    size="sm"
                    variant="outline"
                    color="error"
                    @click="deleteMember(member)"
                  >
                    刪除
                  </UButton>
                </div>
              </div>
            </div>

            <!-- 空狀態 -->
            <div v-else class="py-12 text-center">
              <UIcon
                name="i-lucide-users"
                class="mx-auto mb-4 h-16 w-16 text-gray-400"
              />
              <h3 class="mb-2 text-lg font-semibold">還沒有成員</h3>
              <p class="mb-6 text-gray-500 dark:text-gray-400">
                開始新增隊伍成員來組建你的團隊
              </p>
              <UButton icon="i-lucide-plus" @click="handleAddMember">
                新增第一位成員
              </UButton>
            </div>
          </div>
        </UPageCard>
      </UPageGrid>

      <!-- 成員編輯 Modal -->
      <UModal
        v-model:open="isAddingMember"
        :title="selectedMember ? '編輯成員' : '新增成員'"
        description="填寫成員資訊"
      >
        <template #body>
          <UForm
            ref="memberForm"
            :schema="memberSchema"
            :state="state"
            class="space-y-4"
            @submit="onSubmit"
          >
            <!-- 姓名 -->
            <UFormField label="姓名" name="name" required>
              <UInput v-model="state.name" placeholder="請輸入姓名" size="md" />
            </UFormField>

            <!-- 角色 -->
            <UFormField label="角色" name="role" required>
              <UInput
                v-model="state.role"
                placeholder="例如：隊長、前鋒、後衛..."
                size="md"
              />
            </UFormField>

            <!-- 性別 -->
            <UFormField label="性別" name="gender" required>
              <USelect
                v-model="state.gender"
                :items="[
                  { label: '男', value: 'M' },
                  { label: '女', value: 'F' },
                ]"
                size="md"
              />
            </UFormField>

            <!-- 生日 -->
            <UFormField label="生日" name="birthday" required>
              <UPopover>
                <UButton
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-calendar"
                  class="w-full justify-start"
                  size="md"
                >
                  {{
                    birthdayCalendar &&
                    typeof birthdayCalendar === "object" &&
                    "toDate" in birthdayCalendar
                      ? new Intl.DateTimeFormat("zh-TW", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }).format((birthdayCalendar as any).toDate("UTC"))
                      : "請選擇生日"
                  }}
                </UButton>

                <template #content>
                  <UCalendar v-model="birthdayCalendar" class="p-2" />
                </template>
              </UPopover>
            </UFormField>

            <!-- 手機 -->
            <UFormField label="手機號碼" name="phone">
              <UInput
                v-model="state.phone"
                placeholder="請輸入手機號碼（選填）"
                size="md"
              />
            </UFormField>

            <!-- 電子郵件 -->
            <UFormField label="電子郵件" name="email">
              <UInput
                v-model="state.email"
                type="email"
                placeholder="請輸入電子郵件（選填）"
                size="md"
              />
            </UFormField>
          </UForm>
        </template>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton variant="outline" @click="handleCloseModal">
              取消
            </UButton>
            <UButton @click="submitMemberForm">
              {{ selectedMember ? "更新" : "新增" }}
            </UButton>
          </div>
        </template>
      </UModal>
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
          @click="refresh"
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
