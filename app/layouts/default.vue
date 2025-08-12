<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui"
import { authClient } from "~~/auth-client"
const navigationMenuItems = ref<NavigationMenuItem[]>([
  {
    label: "近期賽事",
    to: "/",
  },
  {
    label: "區域賽事",
    to: "/region",
    children: [
      {
        label: "基隆市",
        description: "在基隆市舉辦的賽事",
        to: "/region/keelung",
      },
      {
        label: "新北市",
        description: "在新北市舉辦的賽事",
        to: "/region/new-taipei",
      },
      {
        label: "臺北市",
        description: "在臺北市舉辦的賽事",
        to: "/region/taipei",
      },
      {
        label: "桃園市",
        description: "在桃園市舉辦的賽事",
        to: "/region/taoyuan",
      },
      {
        label: "新竹縣",
        description: "在新竹縣舉辦的賽事",
        to: "/region/hsinchu-county",
      },
      {
        label: "新竹市",
        description: "在新竹市舉辦的賽事",
        to: "/region/hsinchu-city",
      },
      {
        label: "苗栗市",
        description: "在苗栗市舉辦的賽事",
        to: "/region/miaoli",
      },
      {
        label: "苗栗縣",
        description: "在苗栗縣舉辦的賽事",
        to: "/region/miaoli",
      },
      {
        label: "臺中市",
        description: "在臺中市舉辦的賽事",
        to: "/region/taichung",
      },
      {
        label: "彰化縣",
        description: "在彰化縣舉辦的賽事",
        to: "/region/changhua",
      },
      {
        label: "彰化市",
        description: "在彰化市舉辦的賽事",
        to: "/region/changhua",
      },
      {
        label: "南投市",
        description: "在南投市舉辦的賽事",
        to: "/region/nantou",
      },
      {
        label: "南投縣",
        description: "在南投縣舉辦的賽事",
        to: "/region/nantou",
      },
      {
        label: "雲林縣",
        description: "在雲林縣舉辦的賽事",
        to: "/region/yunlin",
      },
      {
        label: "嘉義縣",
        description: "在嘉義縣舉辦的賽事",
        to: "/region/chiayi-county",
      },
      {
        label: "嘉義市",
        description: "在嘉義市舉辦的賽事",
        to: "/region/chiayi-city",
      },
      {
        label: "臺南市",
        description: "在臺南市舉辦的賽事",
        to: "/region/tainan",
      },
      {
        label: "高雄市",
        description: "在高雄市舉辦的賽事",
        to: "/region/kaohsiung",
      },
      {
        label: "屏東縣",
        description: "在屏東縣舉辦的賽事",
        to: "/region/pingtung",
      },
      {
        label: "屏東市",
        description: "在屏東市舉辦的賽事",
        to: "/region/pingtung",
      },
      {
        label: "宜蘭縣",
        description: "在宜蘭縣舉辦的賽事",
        to: "/region/yilan",
      },
      {
        label: "宜蘭市",
        description: "在宜蘭市舉辦的賽事",
        to: "/region/yilan",
      },
      {
        label: "花蓮縣",
        description: "在花蓮縣舉辦的賽事",
        to: "/region/hualien",
      },
      {
        label: "花蓮市",
        description: "在花蓮市舉辦的賽事",
        to: "/region/hualien",
      },
      {
        label: "臺東市",
        description: "在臺東市舉辦的賽事",
        to: "/region/taitung",
      },
      {
        label: "臺東縣",
        description: "在臺東縣舉辦的賽事",
        to: "/region/taitung",
      },
      {
        label: "澎湖縣",
        description: "在澎湖縣舉辦的賽事",
        to: "/region/penghu",
      },
      {
        label: "綠島",
        description: "在綠島舉辦的賽事",
        to: "/region/penghu",
      },
      {
        label: "蘭嶼",
        description: "在蘭嶼舉辦的賽事",
        to: "/region/kinmen",
      },
      {
        label: "金門縣",
        description: "在金門縣舉辦的賽事",
        to: "/region/kinmen",
      },
      {
        label: "馬祖",
        description: "在馬祖舉辦的賽事",
        to: "/region/lienchiang",
      },
      {
        label: "連江縣",
        description: "在連江縣舉辦的賽事",
        to: "/region/lienchiang",
      },
    ],
  },
  {
    label: "過往賽事",
    to: "/ended",
  },
])

const { data: session } = await authClient.useSession(useFetch)
</script>

<template>
  <UPage>
    <UHeader mode="slideover">
      <template #title>競賽報名系統</template>
      <template #default>
        <UNavigationMenu :items="navigationMenuItems" />
      </template>
      <template #right>
        <UColorModeButton />
        <UserMenu v-if="session" />
        <UButton v-else label="登入/註冊" to="/accounts/login" />
      </template>
      <template #body>
        <UserMenu v-if="session" />
        <UButton v-else label="登入/註冊" to="/accounts/login" />
        <UNavigationMenu :items="navigationMenuItems" orientation="vertical" />
      </template>
    </UHeader>
    <UMain>
      <UContainer>
        <UPage>
          <slot />
        </UPage>
      </UContainer>
    </UMain>
    <UFooter>
      <template #top>
        <Advertise />
      </template>
      <template #left>
        <Copyright />
      </template>
      <template #right></template>
    </UFooter>
  </UPage>
</template>

<style scoped></style>
