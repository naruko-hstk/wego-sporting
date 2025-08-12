<script setup lang="ts">
import * as z from "zod"
import type { FormSubmitEvent } from "@nuxt/ui"
import { authClient } from "~~/auth-client"

const toast = useToast()

const isSubmitting = ref(false)

const fields = [
  {
    name: "username",
    type: "text" as const,
    label: "使用者名稱",
    placeholder: "請輸入您的使用者名稱",
    required: true,
  },
  {
    name: "password",
    label: "密碼",
    type: "password" as const,
    placeholder: "請輸入您的密碼",
    required: true,
  },
]

const providers = [
  {
    label: "Google",
    icon: "i-simple-icons-google",
    onClick: handleGoogleLogin,
  },
]

const schema = z.object({
  username: z.string().min(2, "使用者名稱至少需要 2 個字元"),
  password: z.string().min(8, "密碼至少需要 8 個字元"),
})

type Schema = z.output<typeof schema>

/**
 * Handle username/password login
 */
async function onSubmit(payload: FormSubmitEvent<Schema>) {
  if (isSubmitting.value) return

  isSubmitting.value = true

  try {
    const result = await authClient.signIn.username({
      username: payload.data.username,
      password: payload.data.password,
    })

    if (result.error) {
      toast.add({
        title: "登入失敗",
        description: result.error.message || "登入過程中發生錯誤",
        color: "error",
      })
      return
    }

    toast.add({
      title: "登入成功",
      description: "歡迎回來！",
      color: "success",
    })
  } catch (error) {
    console.error("登入錯誤:", error)
    toast.add({
      title: "登入失敗",
      description: "登入過程中發生未預期的錯誤",
      color: "error",
    })
  } finally {
    isSubmitting.value = false
  }
}

/**
 * Handle Google OAuth login
 */
async function handleGoogleLogin() {
  try {
    await authClient.signIn.social({
      provider: "google",
    })
  } catch (error) {
    console.error("Google 登入錯誤:", error)
    toast.add({
      title: "登入失敗",
      description: "Google 登入過程中發生錯誤",
      color: "error",
    })
  }
}

definePageMeta({ layout: "auth" })
</script>

<template>
  <UPageCard class="w-full max-w-md" variant="soft">
    <UAuthForm
      :schema="schema"
      title="登入系統"
      description="使用Google帳號以繼續."
      icon="i-lucide-user-round"
      :fields="fields"
      :providers="providers"
      :loading="isSubmitting"
      separator="或使用帳號密碼登入"
      @submit="onSubmit"
    >
      <template #username-hint
        >沒有帳號?&nbsp;
        <ULink
          to="/accounts/register"
          class="text-primary font-medium transition-colors duration-300"
          tabindex="-1"
          >立即註冊</ULink
        >&nbsp;&nbsp;
      </template>
      <template #password-hint>
        <ULink
          to="/accounts/forgot-password"
          class="text-primary font-medium transition-colors duration-300"
          tabindex="-1"
          >忘記密碼?</ULink
        >
      </template>

      <template #footer>
        <!-- 服務條款和隱私政策同意聲明 -->
        <div class="text-center text-xs leading-relaxed">
          使用本服務即表示您同意我們的
          <ULink to="/terms-of-service" class="text-primary" target="_blank"
            >服務條款</ULink
          >
          和
          <ULink to="/privacy-policy" class="text-primary" target="_blank"
            >隱私政策</ULink
          >
        </div>
      </template>
    </UAuthForm>
  </UPageCard>
</template>

<style scoped></style>
