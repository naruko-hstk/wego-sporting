<script setup lang="ts">
import { authClient } from "~~/auth-client"
import type { DropdownMenuItem } from "@nuxt/ui"

const { data: session } = await authClient.useSession(useFetch)

const dropdownMenuItems = computed<DropdownMenuItem[][]>(() => {
  const role = session.value?.user.role ?? "user"
  const dynamicItems: DropdownMenuItem[] = []

  if (role === "owner" || role === "leader")
    dynamicItems.push({
      label: "隊伍管理",
      href: "/team",
      icon: "i-lucide-users",
      color: "info",
    })
  if (role === "owner" || role === "admin")
    dynamicItems.push({
      label: "前往後台",
      href: "/dashboard",
      icon: "i-lucide-shield",
      color: "primary",
    })

  return [
    [
      {
        label: "帳號資訊",
        href: "/accounts/profile",
        icon: "i-lucide-user",
      },
    ],
    dynamicItems,
    [
      {
        label: "登出",
        onSelect: async () => {
          await authClient.signOut({
            fetchOptions: {
              onSuccess: () => {
                navigateTo("/")
              },
            },
          })
        },
        icon: "i-lucide-log-out",
        color: "error",
      },
    ],
  ]
})
const mobileMenuItems = computed(() => {
  const role = session?.value?.user.role ?? "guest"
  const items: Array<{
    label: string
    to?: string
    icon: string
    color?: "primary" | "info" | "error" | "neutral"
    click?: () => void
  }> = [
    {
      label: "帳號資訊",
      to: "/accounts/profile",
      icon: "i-lucide-user",
      color: "neutral", // 使用 neutral 色調與桌面版一致
    },
  ]

  // 後台權限：owner 或 admin
  if (role === "owner" || role === "admin") {
    items.push({
      label: "前往後台",
      to: "/dashboard",
      icon: "i-lucide-shield",
      color: "primary",
    })
  }

  // 隊伍管理權限：owner 或 leader
  if (role === "owner" || role === "leader") {
    items.push({
      label: "隊伍管理",
      to: "/team",
      icon: "i-lucide-users",
      color: "info",
    })
  }

  items.push({
    label: "登出",
    icon: "i-lucide-log-out",
    color: "error",
    click: async () => {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            // 登出成功後重導向
            if (typeof window !== "undefined") {
              window.location.href = "/accounts/login"
            }
          },
        },
      })
    },
  })

  return items
})
</script>

<template>
  <div>
    <div class="hidden md:block">
      <UDropdownMenu
        :items="dropdownMenuItems"
        :content="{
          align: 'end',
        }"
      >
        <UAvatar
          :src="session?.user.image ?? undefined"
          :alt="session?.user.name ?? undefined"
        />
        <template #welcome-label>
          登入中的使用者:
          <b>
            {{ session?.user.name ?? undefined }}
          </b>
        </template>
      </UDropdownMenu>
    </div>
    <div class="md:hidden">
      <div class="space-y-1">
        <UButton
          v-for="item in mobileMenuItems"
          :key="item.label"
          :to="item.to"
          :icon="item.icon"
          :color="item.color"
          variant="ghost"
          size="sm"
          block
          justify="start"
          class="justify-start text-left"
          @click="item.click"
        >
          {{ item.label }}
        </UButton>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
