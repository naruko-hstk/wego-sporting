<script setup lang="ts">
import * as z from "zod"
import type { FormSubmitEvent } from "@nuxt/ui"
import { authClient } from "~~/auth-client"

const toast = useToast()
const router = useRouter()

const isSubmitting = ref(false)
const usernameError = ref("")

const fields = [
  {
    name: "email",
    type: "text" as const,
    label: "電子郵件",
    placeholder: "請輸入您的電子郵件",
    required: true,
  },
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
  {
    name: "confirmPassword",
    label: "確認密碼",
    type: "password" as const,
    placeholder: "請再次輸入您的密碼",
    required: true,
  },
]

const schema = z
  .object({
    email: z.string().email("請輸入有效的電子郵件地址"),
    username: z
      .string()
      .min(3, "使用者名稱至少需要 3 個字元")
      .max(30, "使用者名稱不得超過 30 個字元"),
    password: z.string().min(8, "密碼至少需要 8 個字元"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "密碼不一致",
    path: ["confirmPassword"],
  })

type Schema = z.output<typeof schema>

/**
 * Handle user registration with email and username
 */
async function onSubmit(payload: FormSubmitEvent<Schema>) {
  if (isSubmitting.value) return

  isSubmitting.value = true
  usernameError.value = ""

  try {
    // 檢查使用者名稱是否可用
    const usernameCheck = await authClient.isUsernameAvailable({
      username: payload.data.username,
    })

    if (usernameCheck.error || !usernameCheck.data?.available) {
      usernameError.value = "此使用者名稱已被使用"
      return
    }

    // 註冊使用者
    const result = await authClient.signUp.email({
      email: payload.data.email,
      password: payload.data.password,
      name: payload.data.username,
      callbackURL: "/dashboard",
    })

    if (result.error) {
      toast.add({
        title: "註冊失敗",
        description: result.error.message || "註冊過程中發生錯誤",
        color: "error",
      })
      return
    }

    // 註冊成功後設定使用者名稱
    if (result.data) {
      const updateResult = await authClient.updateUser({
        username: payload.data.username,
      })

      if (updateResult.error) {
        console.warn("設定使用者名稱失敗:", updateResult.error)
      }
    }

    toast.add({
      title: "註冊成功",
      description: "歡迎加入！您已成功註冊帳號",
      color: "success",
    })

    // 重導向到儀表板
    await router.push("/dashboard")
  } catch (error) {
    console.error("註冊錯誤:", error)
    toast.add({
      title: "註冊失敗",
      description: "註冊過程中發生未預期的錯誤",
      color: "error",
    })
  } finally {
    isSubmitting.value = false
  }
}

definePageMeta({ layout: "auth" })
</script>

<template>
  <UPageCard class="w-full max-w-md" variant="soft">
    <UAuthForm
      :schema="schema"
      title="註冊帳號"
      icon="i-lucide-user-round-plus"
      :fields="fields"
      :loading="isSubmitting"
      @submit="onSubmit"
    >
      <template #description>
        <div class="text-center">
          <p>註冊本平台使用者帳號</p>
          <p class="text-sm">
            使用Google帳號註冊請至
            <ULink to="/accounts/login" class="text-primary font-medium"
              >登入頁</ULink
            >直接使用Google帳號登入
          </p>
        </div>
      </template>

      <template #email-hint>
        已有帳號?&nbsp;
        <ULink to="/accounts/login" class="text-primary font-medium"
          >立即登入</ULink
        >&nbsp;&nbsp;
      </template>
      <template #validation>
        <UAlert
          v-if="usernameError"
          :title="usernameError"
          color="error"
          variant="subtle"
          class="mb-4"
        />
      </template>

      <template #footer>
        <!-- 服務條款和隱私政策同意聲明 -->
        <div class="text-center text-xs leading-relaxed text-gray-500">
          點擊「註冊帳號」即表示您同意我們的
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
