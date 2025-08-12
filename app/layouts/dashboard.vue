<script setup lang="ts">
import { authClient } from "~~/auth-client"
import type { DropdownMenuItem, NavigationMenuItem } from "@nuxt/ui"
import { useDashboardStats } from "~/composables/use-dashboard-stats"

const { statistics, refresh } = useDashboardStats()
provide("refreshDashboardStats", refresh)
const { data: session } = await authClient.useSession(useFetch)

// Wait for session to be available before refreshing stats
watch(
  session,
  async (newSession) => {
    if (
      newSession?.user &&
      ["admin", "owner"].includes(newSession.user.role || "")
    ) {
      await refresh()
    }
  },
  { immediate: true },
)

const logoSize = "38"
const items = computed<NavigationMenuItem[][]>(() => [
  [
    {
      label: "概覽",
      icon: "i-lucide-house",
      to: "/dashboard",
    },
    {
      label: "賽事管理",
      icon: "i-lucide-swords",
      badge: {
        color: "info",
        label: statistics.value?.gamesCount?.toString() ?? 0,
      },
      to: "/dashboard/games",
    },
    {
      label: "帳號管理",
      icon: "i-lucide-users-round",
      badge: {
        color: "info",
        label: statistics.value?.usersCount?.toString() ?? 0,
      },
      to: "/dashboard/users",
    },
  ],
  [
    {
      label: "聯絡作者",
      icon: "i-lucide-message-circle-plus",
      to: "https://github.com/nuxt-ui-pro/dashboard",
      target: "_blank",
    },
  ],
])

const dropdownMenuItems: DropdownMenuItem[][] = [
  [
    {
      label: "個人資料",
      icon: "i-lucide-user",
      to: "/accounts/profile",
    },
    {
      label: "修改密碼",
      icon: "i-lucide-lock",
      to: "/accounts/change-password",
    },
  ],
  [{ label: "返回前台", icon: "i-lucide-home", to: "/" }],
  [
    {
      label: "登出",
      icon: "i-lucide-log-out",
      color: "error",
      click: () => authClient.signOut(),
    },
  ],
]
</script>

<template>
  <div>
    <UDashboardGroup>
      <UDashboardSidebar
        :default-size="13"
        collapsible
        :ui="{ footer: 'border-t border-default' }"
      >
        <template #header="{ collapsed }">
          <NuxtImg
            v-show="!collapsed"
            src="/logo.svg"
            :width="logoSize"
            :height="logoSize"
          />
          <span v-show="!collapsed">競賽報名系統後台</span>
          <UDashboardSidebarCollapse />
        </template>

        <template #default="{ collapsed }">
          <UNavigationMenu
            :collapsed="collapsed"
            :items="items[0]"
            orientation="vertical" />
          <UNavigationMenu
            :collapsed="collapsed"
            :items="items[1]"
            orientation="vertical"
            class="mt-auto"
        /></template>
        <template #footer="{ collapsed }">
          <UDropdownMenu
            :items="dropdownMenuItems"
            :content="{ side: 'bottom' }"
          >
            <UButton
              color="neutral"
              variant="ghost"
              class="w-full px-2"
              :block="collapsed"
            >
              <template #default>
                <div class="flex w-full items-end justify-between">
                  <div class="flex items-center space-x-2">
                    <UAvatar
                      :src="session?.user.image ?? undefined"
                      :alt="session?.user.name ?? undefined"
                      size="xs"
                    />
                    <span v-if="!collapsed" class="text-sm font-medium">
                      {{ session?.user.name ?? "" }}
                    </span>
                  </div>
                  <UIcon
                    v-if="!collapsed"
                    name="i-lucide-chevron-up"
                    class="text-base"
                  />
                </div>
              </template>
            </UButton>
          </UDropdownMenu>
        </template>
      </UDashboardSidebar>
      <UPage class="w-full overflow-auto px-8 py-4">
        <slot />
      </UPage>
    </UDashboardGroup>
  </div>
</template>

<style scoped></style>
