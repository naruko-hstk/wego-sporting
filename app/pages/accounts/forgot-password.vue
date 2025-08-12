<script setup lang="ts">
import * as z from "zod"
import type { FormSubmitEvent } from "@nuxt/ui"
import { authClient } from "~~/auth-client"

const toast = useToast()
const loading = ref(false)

// Form state
const state = reactive({
  email: "",
})

const schema = z.object({
  email: z
    .string()
    .email("請輸入有效的電子信箱格式")
    .min(1, "電子信箱為必填項目"),
})

type Schema = z.output<typeof schema>

/**
 * Handle forgot password form submission
 * @param payload Form data containing email
 */
async function onSubmit(payload: FormSubmitEvent<Schema>) {
  try {
    loading.value = true

    // Use Better Auth's requestPasswordReset
    const { error } = await authClient.requestPasswordReset({
      email: payload.data.email,
      redirectTo: `${window.location.origin}/accounts/reset-password`,
    })

    if (error) {
      throw new Error(error.message || "請求失敗")
    }

    toast.add({
      title: "重置郵件已發送",
      description: "如果該電子信箱已註冊，您將收到密碼重置連結",
      color: "success",
    })
  } catch (error) {
    console.error("Forgot password error:", error)

    // Handle FetchError from Nuxt
    const errorMessage =
      error instanceof Error && "data" in error
        ? (error as { data?: { message?: string } }).data?.message ||
          error.message
        : "無法發送重置郵件，請稍後再試"

    toast.add({
      title: "發送失敗",
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
          <UIcon name="i-lucide-lock-keyhole" class="text-primary h-6 w-6" />
        </div>
        <h1 class="text-xl font-semibold">重置密碼</h1>
        <p class="text-center text-sm text-gray-500">
          請輸入您的電子信箱，我們將發送重置連結給您
        </p>
      </div>

      <!-- Form -->
      <UForm
        :schema="schema"
        :state="state"
        class="w-full space-y-4"
        :loading="loading"
        @submit="onSubmit"
      >
        <UFormField label="電子信箱" name="email" required>
          <UInput
            v-model="state.email"
            type="email"
            placeholder="請輸入您註冊時使用的電子信箱"
          />
        </UFormField>

        <UButton type="submit" block :loading="loading">發送重置連結</UButton>

        <div class="flex items-center justify-between pt-4">
          <ULink to="/accounts/login" class="text-primary text-sm font-medium">
            返回登入
          </ULink>
          <ULink
            to="/accounts/register"
            class="text-primary text-sm font-medium"
          >
            註冊新帳號
          </ULink>
        </div>
      </UForm>
    </div>
  </UPageCard>
</template>

<style scoped></style>
