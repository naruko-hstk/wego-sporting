<script setup lang="ts">
import { z } from "zod"
import type { FormSubmitEvent } from "@nuxt/ui"
import { authClient } from "~~/auth-client"

const toast = useToast()
const { data: session } = await authClient.useSession(useFetch)

// 如果未登入，重導向到登入頁
if (!session.value) {
  throw createError({
    statusCode: 401,
    statusMessage: "請先登入",
  })
}

// 檢查用戶是否有密碼憑證
const hasCredential = await $fetch("/api/user/has-credential", {
  method: "GET",
  headers: useRequestHeaders(["cookie"]),
})

const isUpdating = ref(false)

// 表單驗證 Schema
const profileSchema = z.object({
  name: z.string().min(1, "姓名不能為空").max(50, "姓名不能超過50字"),
  email: z.email("請輸入有效的電子郵件地址"),
  username: z
    .string()
    .min(3, "使用者名稱至少需要 3 個字元")
    .max(30, "使用者名稱不得超過 30 個字元")
    .optional()
    .or(z.literal("")),
})

type ProfileSchema = z.output<typeof profileSchema>

// 初始表單狀態
const form = reactive<ProfileSchema>({
  name: session.value?.user.name || "",
  email: session.value?.user.email || "",
  username: session.value?.user.username || "",
})

// 密碼變更表單 - 根據是否有憑證決定表單結構
const passwordForm = reactive({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
})

// 動態密碼驗證 Schema - 有憑證需要目前密碼，沒有憑證只需要新密碼
const passwordSchema = computed(() => {
  if (hasCredential.hasCredential) {
    // 有密碼憑證的用戶需要輸入目前密碼
    return z
      .object({
        currentPassword: z.string().min(1, "請輸入目前密碼"),
        newPassword: z.string().min(8, "新密碼至少需要 8 個字元"),
        confirmPassword: z.string(),
      })
      .refine((data) => data.newPassword === data.confirmPassword, {
        message: "密碼不一致",
        path: ["confirmPassword"],
      })
  } else {
    // OAuth2 用戶首次設定密碼
    return z
      .object({
        newPassword: z.string().min(8, "密碼至少需要 8 個字元"),
        confirmPassword: z.string(),
      })
      .refine((data) => data.newPassword === data.confirmPassword, {
        message: "密碼不一致",
        path: ["confirmPassword"],
      })
  }
})

// 更新個人資料
async function onProfileSubmit(event: FormSubmitEvent<ProfileSchema>) {
  if (isUpdating.value) return

  isUpdating.value = true

  try {
    // 檢查使用者名稱是否可用（如果有變更）
    if (
      event.data.username &&
      event.data.username !== session.value?.user.username
    ) {
      const usernameCheck = await authClient.isUsernameAvailable({
        username: event.data.username,
      })

      if (usernameCheck.error || !usernameCheck.data?.available) {
        toast.add({
          title: "更新失敗",
          description: "此使用者名稱已被使用",
          color: "error",
        })
        return
      }
    }

    // 更新使用者資料
    if (
      event.data.username &&
      event.data.username !== session.value?.user.username
    ) {
      const updateResult = await authClient.updateUser({
        username: event.data.username,
      })

      if (updateResult.error) {
        toast.add({
          title: "更新失敗",
          description: updateResult.error.message || "更新使用者名稱失敗",
          color: "error",
        })
        return
      }
    }

    toast.add({
      title: "更新成功",
      description: "個人資料已成功更新",
      color: "success",
    })

    // 重新載入頁面以更新 session
    await navigateTo("/accounts/profile", { replace: true })
  } catch (error) {
    console.error("更新個人資料錯誤:", error)
    toast.add({
      title: "更新失敗",
      description: "更新過程中發生錯誤",
      color: "error",
    })
  } finally {
    isUpdating.value = false
  }
}

// 更新密碼
async function onPasswordSubmit(
  event: FormSubmitEvent<Record<string, string>>,
) {
  if (isUpdating.value) return

  isUpdating.value = true

  try {
    if (hasCredential.hasCredential) {
      // 有密碼憑證的用戶 - 變更密碼
      const response = await $fetch("/api/user/change-password", {
        method: "POST",
        body: {
          currentPassword: event.data.currentPassword,
          newPassword: event.data.newPassword,
        },
      })

      if (response.success) {
        toast.add({
          title: "密碼變更成功",
          description: "您的密碼已成功變更",
          color: "success",
        })
      }
    } else {
      // OAuth2 用戶 - 首次設定密碼
      const response = await $fetch("/api/user/set-password", {
        method: "POST",
        body: {
          newPassword: event.data.newPassword,
        },
      })

      if (response.success) {
        toast.add({
          title: "密碼設定成功",
          description: "您已成功設定登入密碼，現在可以使用密碼登入",
          color: "success",
        })

        // 重新載入頁面以更新憑證狀態
        await navigateTo("/accounts/profile", { replace: true })
      }
    }

    // 清空表單
    Object.assign(passwordForm, {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    })
  } catch (error: unknown) {
    console.error("密碼操作錯誤:", error)

    const errorMessage =
      error &&
      typeof error === "object" &&
      "data" in error &&
      error.data &&
      typeof error.data === "object" &&
      "message" in error.data
        ? String(error.data.message)
        : error instanceof Error
          ? error.message
          : "密碼操作失敗"

    toast.add({
      title: hasCredential.hasCredential ? "變更失敗" : "設定失敗",
      description: errorMessage,
      color: "error",
    })
  } finally {
    isUpdating.value = false
  }
}

// 頁面 Meta
useSeoMeta({
  title: "個人資料 - 競賽報名系統",
  description: "管理您的個人資料和帳號設定",
})
</script>

<template>
  <div>
    <UPageHeader
      title="個人資料"
      description="管理您的個人資料和帳號設定"
      class="mb-8"
    >
      <template #links>
        <UButton icon="i-lucide-arrow-left" variant="ghost" to="/">
          返回首頁
        </UButton>
      </template>
    </UPageHeader>

    <UPageGrid>
      <!-- 個人資料編輯 -->
      <UPageCard class="col-span-full lg:col-span-2">
        <template #header>
          <div class="flex items-center gap-3">
            <UAvatar
              :src="session?.user.image ?? undefined"
              :alt="session?.user.name ?? undefined"
              size="lg"
            />
            <div>
              <h2 class="text-xl font-semibold">基本資料</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                更新您的個人資料和聯絡資訊
              </p>
            </div>
          </div>
        </template>

        <UForm
          :schema="profileSchema"
          :state="form"
          class="space-y-6"
          @submit="onProfileSubmit"
        >
          <!-- 姓名 -->
          <UFormField label="姓名" name="name" required>
            <UInput
              v-model="form.name"
              placeholder="請輸入您的姓名"
              icon="i-lucide-user"
            />
          </UFormField>

          <!-- 電子郵件 -->
          <UFormField label="電子郵件" name="email" required>
            <UInput
              v-model="form.email"
              type="email"
              placeholder="請輸入您的電子郵件"
              icon="i-lucide-mail"
              disabled
            />
            <template #hint>
              <span class="text-xs text-gray-500">
                電子郵件無法修改，如需變更請聯絡客服
              </span>
            </template>
          </UFormField>

          <!-- 使用者名稱 -->
          <UFormField label="使用者名稱" name="username">
            <UInput
              v-model="form.username"
              placeholder="請輸入您的使用者名稱"
              icon="i-lucide-at-sign"
            />
            <template #hint>
              <span class="text-xs text-gray-500">
                使用者名稱用於登入和識別，3-30 個字元
              </span>
            </template>
          </UFormField>

          <div class="flex justify-end">
            <UButton type="submit" :loading="isUpdating" icon="i-lucide-save">
              儲存變更
            </UButton>
          </div>
        </UForm>
      </UPageCard>
      <UPageCard class="hidden lg:col-span-1 lg:block">
        <template #header>
          <h2 class="text-xl font-semibold">帳號資訊</h2>
        </template>

        <div class="space-y-4">
          <!-- 註冊時間 -->
          <div>
            <label class="mb-1 block text-sm font-medium">註冊時間</label>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{
                new Date(session?.user.createdAt || "").toLocaleDateString(
                  "zh-TW",
                )
              }}
            </p>
          </div>

          <!-- 使用者角色 -->
          <div>
            <label class="mb-1 block text-sm font-medium">使用者角色</label>
            <UBadge
              :color="
                session?.user.role === 'owner'
                  ? 'red'
                  : session?.user.role === 'admin'
                    ? 'blue'
                    : session?.user.role === 'leader'
                      ? 'green'
                      : 'gray'
              "
              variant="subtle"
            >
              {{
                session?.user.role === "owner"
                  ? "系統管理員"
                  : session?.user.role === "admin"
                    ? "管理員"
                    : session?.user.role === "leader"
                      ? "隊長"
                      : "一般使用者"
              }}
            </UBadge>
          </div>

          <!-- 電子郵件驗證狀態 -->
          <div>
            <label class="mb-1 block text-sm font-medium">電子郵件驗證</label>
            <UBadge
              :color="session?.user.emailVerified ? 'green' : 'orange'"
              variant="subtle"
            >
              {{ session?.user.emailVerified ? "已驗證" : "未驗證" }}
            </UBadge>
          </div>
        </div>
      </UPageCard>
      <!-- 密碼設定 -->
      <UPageCard class="col-span-full lg:col-span-2">
        <template #header>
          <div>
            <h2 class="text-xl font-semibold">
              {{ hasCredential.hasCredential ? "密碼變更" : "密碼設定" }}
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{
                hasCredential.hasCredential
                  ? "變更您的登入密碼"
                  : "為您的帳號設定登入密碼，設定後即可使用密碼登入"
              }}
            </p>
          </div>
        </template>

        <UForm
          :schema="passwordSchema"
          :state="passwordForm"
          class="space-y-6"
          @submit="onPasswordSubmit"
        >
          <!-- 目前密碼 - 只有有憑證的用戶需要 -->
          <UFormField
            v-if="hasCredential.hasCredential"
            label="目前密碼"
            name="currentPassword"
            required
          >
            <UInput
              v-model="passwordForm.currentPassword"
              type="password"
              placeholder="請輸入目前密碼"
              icon="i-lucide-lock"
            />
          </UFormField>

          <!-- 新密碼 -->
          <UFormField
            :label="hasCredential.hasCredential ? '新密碼' : '設定密碼'"
            name="newPassword"
            required
          >
            <UInput
              v-model="passwordForm.newPassword"
              type="password"
              :placeholder="
                hasCredential.hasCredential
                  ? '請輸入新密碼'
                  : '請輸入您要設定的密碼'
              "
              icon="i-lucide-key"
            />
            <template #hint>
              <span class="text-xs text-gray-500">密碼至少需要 8 個字元</span>
            </template>
          </UFormField>

          <!-- 確認密碼 -->
          <UFormField
            :label="hasCredential.hasCredential ? '確認新密碼' : '確認密碼'"
            name="confirmPassword"
            required
          >
            <UInput
              v-model="passwordForm.confirmPassword"
              type="password"
              :placeholder="
                hasCredential.hasCredential
                  ? '請再次輸入新密碼'
                  : '請再次輸入密碼'
              "
              icon="i-lucide-key"
            />
          </UFormField>

          <div class="flex justify-end">
            <UButton
              type="submit"
              :loading="isUpdating"
              icon="i-lucide-shield-check"
              color="orange"
            >
              {{ hasCredential.hasCredential ? "更新密碼" : "設定密碼" }}
            </UButton>
          </div>
        </UForm>
      </UPageCard>

      <!-- 帳號資訊 -->
      <UPageCard class="col-span-full lg:hidden">
        <template #header>
          <h2 class="text-xl font-semibold">帳號資訊</h2>
        </template>

        <div class="space-y-4">
          <!-- 註冊時間 -->
          <div>
            <label class="mb-1 block text-sm font-medium">註冊時間</label>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{
                new Date(session?.user.createdAt || "").toLocaleDateString(
                  "zh-TW",
                )
              }}
            </p>
          </div>

          <!-- 使用者角色 -->
          <div>
            <label class="mb-1 block text-sm font-medium">使用者角色</label>
            <UBadge
              :color="
                session?.user.role === 'owner'
                  ? 'red'
                  : session?.user.role === 'admin'
                    ? 'blue'
                    : session?.user.role === 'leader'
                      ? 'green'
                      : 'gray'
              "
              variant="subtle"
            >
              {{
                session?.user.role === "owner"
                  ? "系統管理員"
                  : session?.user.role === "admin"
                    ? "管理員"
                    : session?.user.role === "leader"
                      ? "隊長"
                      : "一般使用者"
              }}
            </UBadge>
          </div>

          <!-- 電子郵件驗證狀態 -->
          <div>
            <label class="mb-1 block text-sm font-medium">電子郵件驗證</label>
            <UBadge
              :color="session?.user.emailVerified ? 'green' : 'orange'"
              variant="subtle"
            >
              {{ session?.user.emailVerified ? "已驗證" : "未驗證" }}
            </UBadge>
          </div>
        </div>
      </UPageCard>
    </UPageGrid>
  </div>
</template>

<style scoped></style>
