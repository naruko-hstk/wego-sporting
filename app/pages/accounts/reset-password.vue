<script setup lang="ts">
import * as z from "zod"
import type { FormSubmitEvent } from "@nuxt/ui"
import { authClient } from "~~/auth-client"

const toast = useToast()
const router = useRouter()
const route = useRoute()
const loading = ref(false)

// Form state using reactive
const state = reactive({
  newPassword: "",
  confirmPassword: "",
})

// Get token from URL query parameter
const token = computed(() => route.query.token as string)
const error = computed(() => route.query.error as string)

// Show error if token is invalid
onMounted(() => {
  if (error.value === "INVALID_TOKEN") {
    toast.add({
      title: "重置連結無效",
      description: "重置連結已過期或無效，請重新申請",
      color: "error",
    })
    router.push("/accounts/forgot-password")
  }
})

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, "密碼至少需要 8 個字元")
      .max(128, "密碼最多 128 個字元"),
    confirmPassword: z.string().min(1, "請確認您的密碼"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "密碼不一致",
    path: ["confirmPassword"],
  })

type Schema = z.output<typeof schema>

/**
 * Handle password reset form submission
 */
async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (!token.value) {
    toast.add({
      title: "重置失敗",
      description: "缺少重置 token，請重新申請重置連結",
      color: "error",
    })
    return
  }

  try {
    loading.value = true

    // Use Better Auth's resetPassword
    const { error } = await authClient.resetPassword({
      newPassword: event.data.newPassword,
      token: token.value,
    })

    if (error) {
      throw new Error(error.message || "密碼重置失敗")
    }

    toast.add({
      title: "密碼重置成功",
      description: "您的密碼已成功重置，請使用新密碼登入",
      color: "success",
    })

    // Redirect to login page
    await router.push("/accounts/login")
  } catch (error) {
    console.error("Reset password error:", error)

    const errorMessage =
      error instanceof Error ? error.message : "密碼重置失敗，請重新嘗試"

    toast.add({
      title: "重置失敗",
      description: errorMessage,
      color: "error",
    })
  } finally {
    loading.value = false
  }
}

definePageMeta({ layout: "auth" })
</script>

<template>
  <UPageCard class="w-full max-w-md" variant="soft">
    <div class="flex flex-col items-center gap-6 p-6">
      <!-- Header -->
      <div class="flex flex-col items-center gap-2">
        <div
          class="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full"
        >
          <UIcon name="i-lucide-key" class="text-primary h-6 w-6" />
        </div>
        <h1 class="text-xl font-semibold">設定新密碼</h1>
        <p class="text-center text-sm text-gray-500">請輸入您的新密碼</p>
      </div>

      <!-- Form -->
      <UForm
        :schema="schema"
        :state="state"
        class="w-full space-y-4"
        :disabled="!token || loading"
        @submit="onSubmit"
      >
        <UFormField label="新密碼" name="newPassword" required>
          <UInput
            v-model="state.newPassword"
            type="password"
            placeholder="請輸入新密碼"
          />
          <template #hint>
            <div class="text-xs text-gray-500">密碼需要至少 8 個字元</div>
          </template>
        </UFormField>

        <UFormField label="確認密碼" name="confirmPassword" required>
          <UInput
            v-model="state.confirmPassword"
            type="password"
            placeholder="請再次輸入新密碼"
          />
        </UFormField>

        <UButton type="submit" block :loading="loading" :disabled="!token">
          重置密碼
        </UButton>

        <div class="flex items-center justify-between pt-4">
          <ULink
            to="/accounts/forgot-password"
            class="text-primary text-sm font-medium"
          >
            重新申請重置連結
          </ULink>
          <ULink to="/accounts/login" class="text-primary text-sm font-medium">
            返回登入
          </ULink>
        </div>
      </UForm>
    </div>
  </UPageCard>
</template>

<style scoped></style>
