<script setup lang="ts">
import { z } from "zod"
import type { FormSubmitEvent } from "#ui/types"

interface ApiResponse {
  success: boolean
  data?: Team
}

interface Team {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

interface Props {
  open: boolean
  team?: Team | null
}

interface Emits {
  (e: "update:open", value: boolean): void
  (e: "success"): void
}

const props = withDefaults(defineProps<Props>(), {
  team: null,
})

const emit = defineEmits<Emits>()

// 表單驗證 schema
const teamSchema = z.object({
  name: z.string().min(1, "隊伍名稱不能為空").max(50, "隊伍名稱不能超過50字"),
})

type TeamForm = z.infer<typeof teamSchema>

// 表單狀態
const form = reactive<TeamForm>({
  name: "",
})

const formRef = ref()
const isLoading = ref(false)

// 監聽 props 變化，更新表單
watch(
  () => props.team,
  (team) => {
    if (team) {
      form.name = team.name
    } else {
      form.name = ""
    }
  },
  { immediate: true },
)

// 提交表單
async function onSubmit(event: FormSubmitEvent<TeamForm>) {
  try {
    isLoading.value = true

    if (props.team) {
      // 編輯隊伍
      await $fetch<ApiResponse>(`/api/team/${props.team.id}`, {
        method: "PUT",
        body: event.data,
      })
    } else {
      // 創建隊伍
      await $fetch<ApiResponse>("/api/team", {
        method: "POST",
        body: event.data,
      })
    }

    emit("success")
    handleClose()
  } catch (error) {
    console.error("隊伍操作失敗:", error)
  } finally {
    isLoading.value = false
  }
}

// 關閉彈窗
function handleClose() {
  form.name = ""
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
    :title="team ? '編輯隊伍' : '建立隊伍'"
    :ui="{ footer: 'justify-end' }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <UForm
        ref="formRef"
        :schema="teamSchema"
        :state="form"
        @submit="onSubmit"
      >
        <UFormField label="隊伍名稱" name="name" required>
          <UInput
            v-model="form.name"
            placeholder="請輸入隊伍名稱"
            :disabled="isLoading"
          />
        </UFormField>
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
        {{ team ? "更新" : "建立" }}
      </UButton>
    </template>
  </UModal>
</template>
