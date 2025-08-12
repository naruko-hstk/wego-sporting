<script setup lang="ts">
import { z } from "zod"
import type { FormSubmitEvent } from "#ui/types"
import type { UserPlayer } from "~/types/team"

interface Props {
  open: boolean
  userPlayer?: UserPlayer | null
}

interface Emits {
  (e: "update:open", value: boolean): void
  (e: "success"): void
}

const props = withDefaults(defineProps<Props>(), {
  userPlayer: null,
})

const emit = defineEmits<Emits>()

// 表單驗證 schema
const userPlayerSchema = z.object({
  name: z.string().min(1, "姓名不能為空").max(50, "姓名不能超過50字"),
  gender: z.enum(["M", "F"]).refine((val) => val, {
    message: "請選擇性別",
  }),
  birthday: z.string().min(1, "請選擇生日"),
})

type UserPlayerForm = z.infer<typeof userPlayerSchema>

// 表單狀態
const form = reactive<UserPlayerForm>({
  name: "",
  gender: "M",
  birthday: "",
})

const formRef = ref()
const isLoading = ref(false)
const { createUserPlayer, updateUserPlayer } = useUserPlayer()

// 性別選項
const genderOptions = [
  { label: "男", value: "M" },
  { label: "女", value: "F" },
]

// 監聽 props 變化，更新表單
watch(
  () => props.userPlayer,
  (userPlayer) => {
    if (userPlayer) {
      form.name = userPlayer.name
      form.gender = userPlayer.gender
      form.birthday = userPlayer.birthday?.split("T")?.[0] || "" // 轉換為 YYYY-MM-DD 格式
    } else {
      form.name = ""
      form.gender = "M"
      form.birthday = ""
    }
  },
  { immediate: true },
)

// 提交表單
async function onSubmit(event: FormSubmitEvent<UserPlayerForm>) {
  try {
    isLoading.value = true

    if (props.userPlayer) {
      // 編輯隊員
      await updateUserPlayer(props.userPlayer.id, event.data)
    } else {
      // 創建隊員
      await createUserPlayer(event.data)
    }

    emit("success")
    handleClose()
  } catch (error: unknown) {
    console.error("隊員操作失敗:", error)
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

// 計算年齡
const age = computed(() => {
  if (!form.birthday) return ""
  const birthDate = new Date(form.birthday)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--
  }
  return age
})
</script>

<template>
  <UModal
    :open="open"
    :title="userPlayer ? '編輯隊員' : '新增隊員'"
    :ui="{ footer: 'justify-end' }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <UForm
        ref="formRef"
        :schema="userPlayerSchema"
        :state="form"
        @submit="onSubmit"
      >
        <div class="grid grid-cols-1 gap-4">
          <UFormField label="姓名" name="name" required>
            <UInput
              v-model="form.name"
              placeholder="請輸入姓名"
              :disabled="isLoading"
            />
          </UFormField>

          <UFormField label="性別" name="gender" required>
            <USelect
              v-model="form.gender"
              :options="genderOptions"
              :disabled="isLoading"
            />
          </UFormField>

          <UFormField label="生日" name="birthday" required>
            <UInput v-model="form.birthday" type="date" :disabled="isLoading" />
            <template #help>
              <span v-if="age" class="text-sm text-gray-500">
                年齡：{{ age }} 歲
              </span>
            </template>
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
        {{ userPlayer ? "更新" : "新增" }}
      </UButton>
    </template>
  </UModal>
</template>
