<script setup lang="ts">
import { authClient } from "~~/auth-client"
import { useDateFormatter } from "~/composables/useDateFormatter"
import { useGameStatus } from "~/composables/useGameStatus"
import { useRegion } from "~/composables/useRegion"

interface GameDetail {
  id: string
  gameId: string
  basis?: string
  note?: string
  createdAt: string
  updatedAt: string
}

interface GameCategory {
  id: string
  gameId: string
  type: string
  group: string
  level: string
  weightClass: string
  fullName: string
  createdAt: string
  updatedAt: string
  game_fee?: GameFee[]
  registration?: Registration[]
}

interface GameFee {
  id: string
  gameId: string
  categoryId?: string
  feeType: string
  description: string
  amount: string
  isRequired: boolean
  note: string
  createdAt: string
  updatedAt: string
}

interface Registration {
  id: string
}

interface GameData {
  id: string
  name: string
  region: string
  signupStart: string
  signupEnd: string
  gameStart: string
  gameEnd: string
  venue: string
  address: string
  teamMax: number
  teamFull: number
  createdAt: string
  updatedAt: string
  game_detail?: GameDetail
  game_category?: GameCategory[]
  game_fee?: GameFee[]
  registration?: Registration[]
}

const route = useRoute()
const gameId = route.params.id as string

// 設定頁面標題
useSeoMeta({
  title: "賽事詳情",
})

const {
  data: game,
  pending,
  error,
  refresh,
} = await useFetch<GameData>("/api/games", {
  query: { id: gameId },
})

// 檢查使用者登入狀態 (SSR)
const { data: session } = await authClient.useSession(useFetch)

const { formatDate } = useDateFormatter()
const { getGameStatus, getStatusText, getStatusColor } = useGameStatus()
const { getRegionName } = useRegion()

const gameStatus = computed(() => {
  if (!game.value) return "ended"
  return getGameStatus(game.value)
})

const statusText = computed(() => getStatusText(gameStatus.value))
const statusColor = computed(() => getStatusColor(gameStatus.value))

const breadcrumbLinks = computed(() => [
  { label: "首頁", to: "/" },
  { label: "賽事列表", to: "/games" },
  { label: game.value?.name || "賽事詳情" },
])

const openMap = async (address: string) => {
  if (!address) return

  if (import.meta.client) {
    const encodedAddress = encodeURIComponent(address)
    const mapsSearchUrl = `maps:?q=${encodedAddress}`
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`

    try {
      const link = document.createElement("a")
      link.href = mapsSearchUrl
      link.target = "_blank"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setTimeout(() => {
        window.open(googleMapsUrl, "_blank")
      }, 500)
    } catch (err) {
      console.error("地圖打開失敗:", err)
      // 最後手動 fallback
      window.open(googleMapsUrl, "_blank")
    }
  }
}

const timelineItems = computed(() => {
  if (!game.value) return []

  return [
    {
      date: formatDate(game.value.signupStart),
      title: "報名開始",
      description: "開放報名，歡迎踴躍參加",
      icon: "i-lucide-user-plus",
      value: "signup-start",
    },
    {
      date: formatDate(game.value.signupEnd),
      title: "報名截止",
      description: "報名期限結束，準備比賽",
      icon: "i-lucide-user-check",
      value: "signup-end",
    },
    {
      date: formatDate(game.value.gameStart),
      title: "比賽開始",
      description: "比賽正式開始",
      icon: "i-lucide-play",
      value: "game-start",
    },
    {
      date: formatDate(game.value.gameEnd),
      title: "比賽結束",
      description: "比賽圓滿結束",
      icon: "i-lucide-flag",
      value: "game-end",
    },
  ]
})

const currentTimelineIndex = computed(() => {
  if (!game.value) return 0

  const now = new Date()
  const signupStart = new Date(game.value.signupStart)
  const signupEnd = new Date(game.value.signupEnd)
  const gameStart = new Date(game.value.gameStart)
  const gameEnd = new Date(game.value.gameEnd)

  if (now >= gameEnd) return 3
  if (now >= gameStart) return 2
  if (now >= signupEnd) return 1
  if (now >= signupStart) return 0
  return -1
})

const getCategoryName = (categoryId: string | null | undefined) => {
  if (!categoryId || !game.value?.game_category) return null
  const category = game.value.game_category.find((cat) => cat.id === categoryId)
  return category?.fullName || null
}

const totalRegistrations = computed(() => {
  if (!game.value?.game_category) return 0
  return game.value.game_category.reduce((total, category) => {
    return total + (category.registration?.length || 0)
  }, 0)
})

const handleSignup = () => {
  if (game.value) {
    navigateTo(`/games/${game.value.id}/signup`)
  }
}

// 計算報名期間狀態
const signupStatus = computed(() => {
  if (!game.value) return "loading"

  const now = new Date()
  const signupStart = new Date(game.value.signupStart)
  const signupEnd = new Date(game.value.signupEnd)

  if (now < signupStart) return "not-started"
  if (now >= signupEnd) return "ended"
  return "active"
})

const shareGame = async () => {
  if (!game.value) return

  if (import.meta.client && navigator.share) {
    try {
      await navigator.share({
        title: game.value.name,
        url: window.location.href,
      })
    } catch (error) {
      console.log("分享失敗:", error)
    }
  } else {
    // 複製連結到剪貼簿
    if (import.meta.client) {
      await navigator.clipboard.writeText(window.location.href)
      // 這裡可以加入 toast 提示
    }
  }
}

// 收集所有費用資訊（包括全局費用和各組別費用）
const allGameFees = computed(() => {
  if (!game.value) return []

  const fees: GameFee[] = []

  // 添加全局費用
  if (game.value.game_fee?.length) {
    fees.push(...game.value.game_fee)
  }

  // 添加各組別的費用
  if (game.value.game_category?.length) {
    game.value.game_category.forEach((category) => {
      if (category.game_fee?.length) {
        fees.push(...category.game_fee)
      }
    })
  }

  return fees
})

const addToCalendar = () => {
  if (!game.value) return

  if (import.meta.client) {
    const startDate = new Date(game.value.gameStart)
    const endDate = new Date(game.value.gameEnd)

    // 產生 .ics 格式的行事曆內容
    const formatDateForICS = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
    }

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      `DTSTART:${formatDateForICS(startDate)}`,
      `DTEND:${formatDateForICS(endDate)}`,
      `SUMMARY:${game.value.name}`,
      `LOCATION:${game.value.venue}`,
      `DESCRIPTION:${game.value.game_detail?.note || game.value.game_detail?.basis || ""}`,
      `UID:${game.value.id}@wegosporting.com`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n")

    // 嘗試使用原生行事曆 protocol
    const calendarProtocolUrl = `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`

    try {
      // 建立一個隱藏的下載連結來觸發預設行事曆應用程式
      const link = document.createElement("a")
      link.href = calendarProtocolUrl
      link.download = `${game.value.name}.ics`
      link.style.display = "none"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.log("原生行事曆開啟失敗，嘗試 Google 行事曆:", error)

      // Fallback 到 Google 行事曆
      const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(game.value.name)}&dates=${formatDateForICS(startDate)}/${formatDateForICS(endDate)}&location=${encodeURIComponent(game.value.venue)}&details=${encodeURIComponent(game.value.game_detail?.basis || game.value.game_detail?.note || "")}`
      window.open(googleCalendarUrl, "_blank")
    }
  }
}
</script>

<template>
  <div>
    <div v-if="pending" class="flex min-h-[400px] items-center justify-center">
      <div class="text-center">
        <UIcon
          name="i-lucide-loader-2"
          class="text-primary mx-auto mb-4 h-8 w-8 animate-spin"
        />
        <p>載入中...</p>
      </div>
    </div>
    <div v-else-if="error" class="container mx-auto px-4 py-8">
      <UCard class="mx-auto max-w-md text-center">
        <template #header>
          <div class="flex justify-center">
            <UIcon
              name="i-lucide-triangle-alert"
              class="h-12 w-12 text-red-500"
            />
          </div>
        </template>
        <div class="space-y-4">
          <h2 class="text-xl font-semibold">載入失敗</h2>
          <p>無法載入賽事資料，請稍後再試。</p>
          <UButton variant="outline" @click="refresh()"> 重新載入 </UButton>
        </div>
      </UCard>
    </div>
    <div v-else-if="game" class="container mx-auto px-4 py-8">
      <div class="mb-8">
        <UBreadcrumb :items="breadcrumbLinks" class="mb-4" />
        <div
          class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
        >
          <div>
            <h1 class="mb-2 text-3xl font-bold">
              {{ game.name }}
            </h1>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-map-pin" class="h-4 w-4" />
              <span>{{ getRegionName(game.region) }}</span>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <UBadge :color="statusColor" variant="subtle" size="lg">
              {{ statusText }}
            </UBadge>
            <UButton
              v-if="signupStatus === 'loading'"
              size="lg"
              variant="soft"
              disabled
            >
              載入中...
            </UButton>
            <UButton
              v-else-if="signupStatus === 'not-started'"
              size="lg"
              variant="outline"
              icon="i-lucide-clock"
              disabled
            >
              尚未開放報名
            </UButton>
            <UButton
              v-else-if="signupStatus === 'ended'"
              size="lg"
              variant="outline"
              icon="i-lucide-x-circle"
              disabled
            >
              報名已截止
            </UButton>
            <UButton
              v-else-if="signupStatus === 'active' && !session"
              size="lg"
              variant="outline"
              icon="i-lucide-log-in"
              to="/accounts/login"
            >
              請先登入
            </UButton>
            <UButton
              v-else-if="signupStatus === 'active' && session"
              size="lg"
              icon="i-lucide-user-plus"
              @click="handleSignup"
            >
              立即報名
            </UButton>
          </div>
        </div>
      </div>
      <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div class="space-y-6 lg:col-span-2">
          <UCard>
            <template #header>
              <h2 class="flex items-center gap-2 text-xl font-semibold">
                <UIcon name="i-lucide-calendar-clock" class="h-5 w-5" />
                賽事時程
              </h2>
            </template>
            <UTimeline
              v-model="currentTimelineIndex"
              :items="timelineItems"
              color="primary"
              orientation="horizontal"
            />
          </UCard>
          <UCard>
            <template #header>
              <h2 class="flex items-center gap-2 text-xl font-semibold">
                <UIcon name="i-lucide-map-pin" class="h-5 w-5" />
                場地資訊
              </h2>
            </template>
            <div class="space-y-4">
              <div>
                <label class="mb-1 block text-sm font-medium"> 比賽場地 </label>
                <p>
                  {{ game.venue }}
                </p>
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium"> 詳細地址 </label>
                <button
                  class="text-left transition-all duration-200 hover:underline focus:underline focus:outline-none"
                  :title="`點擊在地圖中查看：${game.address}`"
                  @click="openMap(game.address)"
                >
                  <div class="flex items-center gap-2">
                    <UIcon
                      name="i-lucide-map-pin"
                      class="h-4 w-4 text-blue-500"
                    />
                    <span>{{ game.address }}</span>
                  </div>
                </button>
              </div>
            </div>
          </UCard>
          <UCard v-if="game.game_detail?.basis || game.game_detail?.note">
            <template #header>
              <h2 class="flex items-center gap-2 text-xl font-semibold">
                <UIcon name="i-lucide-file-text" class="h-5 w-5" />
                賽事說明
              </h2>
            </template>
            <div class="prose prose-gray max-w-none">
              <p class="whitespace-pre-wrap">
                {{ game.game_detail.basis || game.game_detail.note }}
              </p>
            </div>
          </UCard>
          <UCard v-if="game.game_category?.length">
            <template #header>
              <h2 class="flex items-center gap-2 text-xl font-semibold">
                <UIcon name="i-lucide-tag" class="h-5 w-5" />
                比賽組別
              </h2>
            </template>
            <div class="flex flex-wrap gap-2">
              <UBadge
                v-for="category in game.game_category"
                :key="category.id"
                variant="outline"
                size="lg"
              >
                {{ category.fullName }}
              </UBadge>
            </div>
          </UCard>
          <UCard v-if="allGameFees.length">
            <template #header>
              <h2 class="flex items-center gap-2 text-xl font-semibold">
                <UIcon name="i-lucide-dollar-sign" class="h-5 w-5" />
                報名費用說明
              </h2>
            </template>
            <div class="space-y-4">
              <div
                v-for="fee in allGameFees"
                :key="fee.id"
                class="rounded-lg border p-4"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="mb-2 flex items-center gap-2">
                      <span class="text-lg font-semibold">
                        {{ fee.description }}
                      </span>
                      <UBadge variant="outline" size="xs">
                        {{ fee.isRequired ? "必繳" : "選繳" }}
                      </UBadge>
                    </div>

                    <div class="space-y-2 text-sm">
                      <div
                        v-if="getCategoryName(fee.categoryId)"
                        class="flex items-center gap-2"
                      >
                        <UIcon name="i-lucide-tag" class="h-4 w-4" />
                        <span
                          >適用組別：{{ getCategoryName(fee.categoryId) }}</span
                        >
                      </div>

                      <div v-if="fee.feeType" class="flex items-center gap-2">
                        <UIcon name="i-lucide-info" class="h-4 w-4" />
                        <span>費用類型：{{ fee.feeType }}</span>
                      </div>

                      <div v-if="fee.note" class="flex items-start gap-2">
                        <UIcon
                          name="i-lucide-file-text"
                          class="mt-0.5 h-4 w-4"
                        />
                        <span class="whitespace-pre-wrap">{{ fee.note }}</span>
                      </div>

                      <div
                        v-if="!fee.note && !fee.feeType"
                        class="flex items-center gap-2"
                      >
                        <UIcon name="i-lucide-help-circle" class="h-4 w-4" />
                        <span>賽事相關費用</span>
                      </div>
                    </div>
                  </div>

                  <div class="ml-4 text-right">
                    <div class="text-2xl font-bold">
                      NT$ {{ Number(fee.amount).toLocaleString() }}
                    </div>
                    <div class="mt-1 text-xs">
                      {{ fee.isRequired ? "報名時需繳納" : "可選擇繳納" }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-4 rounded-lg border p-3">
                <div class="flex items-start gap-2">
                  <UIcon name="i-lucide-info" class="mt-0.5 h-5 w-5" />
                  <div class="text-sm">
                    <p class="mb-1 font-medium">費用說明：</p>
                    <ul class="space-y-1 text-xs">
                      <li>• 必繳費用為參加比賽的基本費用</li>
                      <li>• 選繳費用為額外服務項目（如餐點、紀念品等）</li>
                      <li>
                        • 所有費用將用於賽事舉辦、場地租借、獎品採購等相關支出
                      </li>
                      <li>• 報名確認後費用不予退還，請詳閱賽事規則</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </UCard>
        </div>
        <div class="space-y-6">
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">快速操作</h3>
            </template>
            <div class="space-y-3">
              <UButton
                v-if="signupStatus === 'loading'"
                block
                size="lg"
                variant="soft"
                disabled
              >
                載入中...
              </UButton>
              <UButton
                v-else-if="signupStatus === 'not-started'"
                block
                size="lg"
                variant="outline"
                icon="i-lucide-clock"
                disabled
              >
                尚未開放報名
              </UButton>
              <UButton
                v-else-if="signupStatus === 'ended'"
                block
                size="lg"
                variant="outline"
                icon="i-lucide-x-circle"
                disabled
              >
                報名已截止
              </UButton>
              <UButton
                v-else-if="signupStatus === 'active' && !session"
                block
                size="lg"
                variant="outline"
                icon="i-lucide-log-in"
                to="/accounts/login"
              >
                請先登入
              </UButton>
              <UButton
                v-else-if="signupStatus === 'active' && session"
                block
                size="lg"
                icon="i-lucide-user-plus"
                @click="handleSignup"
              >
                立即報名
              </UButton>
              <UButton
                variant="outline"
                block
                icon="i-lucide-share-2"
                @click="shareGame"
              >
                分享賽事
              </UButton>
              <UButton
                variant="outline"
                block
                icon="i-lucide-calendar-plus"
                @click="addToCalendar"
              >
                加入行事曆
              </UButton>
            </div>
          </UCard>
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">報名統計</h3>
            </template>
            <div class="space-y-4">
              <div class="text-center">
                <div class="text-primary mb-1 text-3xl font-bold">
                  {{ totalRegistrations }}
                </div>
                <div class="text-sm">已報名人數</div>
              </div>
              <div v-if="game.game_category?.length" class="border-t pt-3">
                <div class="mb-2 text-sm font-medium">組別分布</div>
                <div class="space-y-2">
                  <div
                    v-for="category in game.game_category"
                    :key="category.id"
                    class="flex justify-between text-sm"
                  >
                    <span>{{ category.fullName }}</span>
                    <span class="font-medium"
                      >{{ category.registration?.length || 0 }} 人</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </div>
  </div>
</template>
