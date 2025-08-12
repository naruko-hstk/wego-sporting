<script setup lang="ts">
import { ref, onMounted, h, resolveComponent } from "vue"
import { useFetch, useRoute } from "#app"
import type { TableColumn } from "@nuxt/ui"
const UBadge = resolveComponent("UBadge")
const UButton = resolveComponent("UButton")
const UAvatar = resolveComponent("UAvatar")

const route = useRoute()
const gameId = route.params.id // 不要移除 game_ 前綴，因為數據庫中有這個前綴

const registrations = ref<any[]>([])
const isLoading = ref(true)

const fetchRegistrations = async () => {
  try {
    isLoading.value = true
    console.log("Fetching registrations for gameId:", gameId)
    const data = await $fetch(`/api/games/${gameId}/registrations`, {
      method: "GET",
    })
    console.log("API Response:", data)
    if (data) {
      registrations.value = data
      console.log("Registrations set:", registrations.value.length)
    }
  } catch (error) {
    console.error("Error fetching registrations:", error)
  } finally {
    isLoading.value = false
  }
}

const approveRegistration = async (id) => {
  try {
    const { error } = await useFetch(`/api/registration/approve`, {
      method: "POST",
      body: { id },
    })

    if (error.value) {
      throw new Error(error.value.data?.message || "審核失敗")
    }

    await fetchRegistrations()
  } catch (error) {
    console.error("Error approving registration:", error)
  }
}

const rejectRegistration = async (id) => {
  try {
    const { error } = await useFetch(`/api/registration/reject`, {
      method: "POST",
      body: { id },
    })

    if (error.value) {
      throw new Error(error.value.data?.message || "審核失敗")
    }

    await fetchRegistrations()
  } catch (error) {
    console.error("Error rejecting registration:", error)
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString("zh-TW")
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return { color: "yellow", label: "待審核" }
    case "approved":
      return { color: "green", label: "已批准" }
    case "rejected":
      return { color: "red", label: "已拒絕" }
    default:
      return { color: "gray", label: "未知" }
  }
}

const columns: TableColumn<any>[] = [
  {
    id: "expand",
    cell: ({ row }) =>
      h(UButton, {
        color: "neutral",
        variant: "ghost",
        icon: "i-lucide-chevron-down",
        square: true,
        "aria-label": "Expand",
        ui: {
          leadingIcon: [
            "transition-transform",
            row.getIsExpanded() ? "duration-200 rotate-180" : "",
          ],
        },
        onClick: () => row.toggleExpanded(),
      }),
  },
  {
    accessorKey: "user",
    header: "報名者",
    cell: ({ row }) =>
      h("div", { class: "flex items-center" }, [
        h(UAvatar, {
          text: row.original.user?.name?.charAt(0),
          size: "sm",
          class: "mr-3",
        }),
        h(
          "div",
          { class: "text-sm font-medium" },
          row.original.user?.name || "未知使用者",
        ),
      ]),
  },
  {
    accessorKey: "user.email",
    header: "電子郵件",
    cell: ({ row }) => row.original.user?.email || "未提供",
  },
  {
    accessorKey: "game_category.fullName",
    header: "賽事組別",
    cell: ({ row }) => row.original.game_category?.fullName || "未知組別",
  },
  {
    accessorKey: "status",
    header: "狀態",
    cell: ({ row }) => {
      const badge = getStatusBadge(row.original.status)
      return h(
        UBadge,
        { color: badge.color, variant: "subtle" },
        () => badge.label,
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: "報名時間",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    id: "actions",
    header: "操作",
    cell: ({ row }) => {
      if (row.original.status === "pending") {
        return h("div", { class: "flex space-x-2" }, [
          h(
            UButton,
            {
              size: "xs",
              color: "green",
              variant: "soft",
              onClick: () => approveRegistration(row.original.id),
            },
            () => "批准",
          ),
          h(
            UButton,
            {
              size: "xs",
              color: "red",
              variant: "soft",
              onClick: () => rejectRegistration(row.original.id),
            },
            () => "拒絕",
          ),
        ])
      }
      return h("span", { class: "text-xs" }, "已處理")
    },
  },
]

// 只允許同時展開一個 row
const expanded = ref<Record<string, boolean>>({})
/**
 * Only allow one row expanded at a time for UTable expandable rows.
 * @param value ExpandedState (Record<string, boolean> | boolean)
 */
function handleExpandChange(value: Record<string, boolean> | boolean) {
  if (typeof value === "boolean") {
    expanded.value = value
      ? {
          ...(registrations.value[0]?.id && {
            [registrations.value[0].id]: true,
          }),
        }
      : {}
    return
  }
  const keys = Object.keys(value).filter((k) => value[k])
  if (keys.length <= 1) {
    expanded.value = { ...value }
  } else {
    const lastKey = String(keys[keys.length - 1])
    expanded.value = { [lastKey]: true }
  }
}

onMounted(() => {
  fetchRegistrations()
})

definePageMeta({
  layout: "dashboard",
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">賽事報名審核</h1>
      <UButton
        :loading="isLoading"
        icon="i-heroicons-arrow-path"
        size="sm"
        color="gray"
        variant="ghost"
        @click="fetchRegistrations"
      >
        重新整理
      </UButton>
    </div>
    <div>
      <div v-if="isLoading" class="flex justify-center py-8">
        <USpinner size="lg" />
      </div>
      <div v-else>
        <div v-if="!registrations.length" class="py-8 text-center">
          <UIcon name="i-heroicons-inbox" class="mx-auto h-12 w-12" />
          <h3 class="mt-2 text-sm font-medium">暫無報名記錄</h3>
          <p class="mt-1 text-sm">目前還沒有使用者報名此賽事</p>
        </div>
        <div v-else>
          <UTable
            :data="registrations"
            :columns="columns"
            sticky
            :expanded="expanded"
            @update:expanded="handleExpandChange"
          >
            <template #expanded="{ row }">
              <div
                class="bg-muted overflow-hidden rounded-lg p-4 transition-all duration-300 ease-in-out"
                :class="
                  expanded[row.id]
                    ? 'max-h-[1000px] opacity-100'
                    : 'max-h-0 py-0 opacity-0'
                "
              >
                <div class="mb-2 font-semibold">詳細資訊</div>
                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <div class="text-muted text-xs">隊伍名稱</div>
                    <div class="font-medium">
                      {{ row.original.team?.name || "—" }}
                    </div>
                  </div>
                  <div>
                    <div class="text-muted text-xs">組別</div>
                    <div>{{ row.original.game_category?.fullName || "—" }}</div>
                  </div>
                  <div>
                    <div class="text-muted text-xs">報名備註</div>
                    <div>{{ row.original.note || "—" }}</div>
                  </div>
                  <div>
                    <div class="text-muted text-xs">報名時間</div>
                    <div>{{ formatDate(row.original.createdAt) }}</div>
                  </div>
                </div>
                <div class="mt-4">
                  <div class="text-muted mb-1 text-xs">參賽隊員</div>
                  <div v-if="row.original.registration_participant?.length">
                    <ul class="list-disc pl-5">
                      <li
                        v-for="p in row.original.registration_participant"
                        :key="p.id"
                      >
                        <span class="font-medium">{{
                          p.team_member?.name
                        }}</span>
                        <span class="text-muted ml-2 text-xs"
                          >({{ p.team_member?.role }} /
                          {{ p.team_member?.gender }} /
                          {{ p.team_member?.birthday?.slice(0, 10) }})</span
                        >
                        <span
                          v-if="p.isMainPlayer"
                          class="text-primary ml-2 text-xs"
                          >主選手</span
                        >
                      </li>
                    </ul>
                  </div>
                  <div v-else class="text-muted">無隊員資料</div>
                </div>
              </div>
            </template>
          </UTable>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
