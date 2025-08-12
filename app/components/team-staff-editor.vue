<script setup lang="ts">
import { z } from "zod"
import type { FormSubmitEvent } from "#ui/types"
import type { TeamStaff } from "~/types/team"

interface Props {
  open: boolean
  teamId: string
  teamStaff?: TeamStaff | null
}

interface Emits {
  (e: "update:open", value: boolean): void
  (e: "success"): void
}

const props = withDefaults(defineProps<Props>(), {
  teamStaff: null,
})

const emit = defineEmits<Emits>()

// 表單驗證 schema
const teamStaffSchema = z.object({
  role: z.enum(["leader", "coach"]).refine((val) => val, {
    message: "請選擇職位",
  }),
  name: z.string().min(1, "姓名不能為空").max(50, "姓名不能超過50字"),
  phone: z.string().optional(),
  email: z.string().email("請輸入有效的信箱").optional().or(z.literal("")),
  address: z.string().optional(),
  lineId: z.string().optional(),
})

type TeamStaffForm = z.infer<typeof teamStaffSchema>

// 表單狀態
const form = reactive<TeamStaffForm>({
  role: "leader",
  name: "",
  phone: "",
  email: "",
  address: "",
  lineId: "",
})

const formRef = ref()
const isLoading = ref(false)
const { createTeamStaff, updateTeamStaff } = useTeamStaff()

// 職位選項
const roleOptions = [
  { label: "領隊", value: "leader" },
  { label: "教練", value: "coach" },
]

// 監聽 props 變化，更新表單
watch(
  () => props.teamStaff,
  (teamStaff) => {
    if (teamStaff) {
      form.role = teamStaff.role as "leader" | "coach"
      form.name = teamStaff.name
      form.phone = teamStaff.phone || ""
      form.email = teamStaff.email || ""
      form.address = teamStaff.address || ""
      form.lineId = teamStaff.lineId || ""
    } else {
      form.role = "leader"
      form.name = ""
      form.phone = ""
      form.email = ""
      form.address = ""
      form.lineId = ""
    }
  },
  { immediate: true },
)

// 提交表單
async function onSubmit(event: FormSubmitEvent<TeamStaffForm>) {
  try {
    isLoading.value = true

    const data = {
      ...event.data,
      ...(props.teamStaff ? {} : { teamId: props.teamId }),
    }

    if (props.teamStaff) {
      // 編輯隊職員
      await updateTeamStaff(props.teamStaff.id, data)
    } else {
      // 創建隊職員
      await createTeamStaff(data as { teamId: string } & TeamStaffForm)
    }

    emit("success")
    handleClose()
  } catch (error: unknown) {
    console.error("隊職員操作失敗:", error)
  } finally {
    isLoading.value = false
  }
}

// 關閉彈窗
function handleClose() {
  emit("update:open", false)
}

// 手動提交表單
async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.submit()
}
</script>

<template>
  <UModal
    :open="open"
    :title="teamStaff ? '編輯隊職員' : '新增隊職員'"
    :ui="{ footer: 'justify-end' }"
    class="md:max-w-2xl"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <UForm
        ref="formRef"
        :schema="teamStaffSchema"
        :state="form"
        @submit="onSubmit"
      >
        <div class="grid grid-cols-1 gap-4">
          <UFormField label="職位" name="role" required>
            <USelect
              v-model="form.role"
              :options="roleOptions"
              :disabled="isLoading"
            />
          </UFormField>

          <UFormField label="姓名" name="name" required>
            <UInput
              v-model="form.name"
              placeholder="請輸入姓名"
              :disabled="isLoading"
            />
          </UFormField>

          <UFormField label="電話" name="phone">
            <UInput
              v-model="form.phone"
              placeholder="請輸入電話號碼"
              :disabled="isLoading"
            />
          </UFormField>

          <UFormField label="Email" name="email">
            <UInput
              v-model="form.email"
              type="email"
              placeholder="請輸入 Email"
              :disabled="isLoading"
            />
          </UFormField>

          <UFormField label="聯絡地址" name="address">
            <UTextarea
              v-model="form.address"
              placeholder="請輸入聯絡地址"
              :disabled="isLoading"
            />
          </UFormField>

          <UFormField label="Line ID" name="lineId">
            <UInput
              v-model="form.lineId"
              placeholder="請輸入 Line ID"
              :disabled="isLoading"
            />
          </UFormField>
        </div>
      </UForm>
    </template>

    <template #footer="{ close }">
      <UButton
        variant="outline"
        color="neutral"
        :disabled="isLoading"
        @click="close"
      >
        取消
      </UButton>
      <UButton :loading="isLoading" @click="handleSubmit">
        {{ teamStaff ? "更新" : "新增" }}
      </UButton>
    </template>
  </UModal>
</template>
