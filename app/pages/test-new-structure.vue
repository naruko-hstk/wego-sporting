<template>
  <div class="container mx-auto space-y-8 p-4">
    <h1 class="mb-6 text-3xl font-bold">新架構測試頁面</h1>

    <!-- 使用者隊員管理 -->
    <div class="rounded-lg bg-white p-6 shadow">
      <h2 class="mb-4 text-2xl font-semibold">我的隊員</h2>
      <UserPlayerEditor />
    </div>

    <!-- 隊伍管理 -->
    <div v-if="teams.length > 0" class="rounded-lg bg-white p-6 shadow">
      <h2 class="mb-4 text-2xl font-semibold">隊伍管理</h2>
      <div class="space-y-4">
        <div v-for="team in teams" :key="team.id" class="rounded-lg border p-4">
          <h3 class="mb-3 text-xl font-medium">{{ team.name }}</h3>
          <TeamStaffEditor :team-id="team.id" />
        </div>
      </div>
    </div>

    <!-- 建立新隊伍 -->
    <div class="rounded-lg bg-white p-6 shadow">
      <h2 class="mb-4 text-2xl font-semibold">建立新隊伍</h2>
      <form class="space-y-4" @submit.prevent="createTeam">
        <div>
          <label for="teamName" class="block text-sm font-medium text-gray-700"
            >隊伍名稱</label
          >
          <input
            id="teamName"
            v-model="newTeamName"
            type="text"
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          class="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
          :disabled="!newTeamName"
        >
          建立隊伍
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
const { data: session } = await useSession()

if (!session.value) {
  navigateTo("/accounts/login")
}

const newTeamName = ref("")
const teams = ref([])

// 載入使用者的隊伍
const loadTeams = async () => {
  try {
    const { data } = await $fetch("/api/team", {
      method: "GET",
    })
    teams.value = data || []
  } catch (error) {
    console.error("載入隊伍失敗:", error)
  }
}

// 建立新隊伍
const createTeam = async () => {
  try {
    await $fetch("/api/team", {
      method: "POST",
      body: {
        name: newTeamName.value,
      },
    })
    newTeamName.value = ""
    await loadTeams()
  } catch (error) {
    console.error("建立隊伍失敗:", error)
  }
}

// 初始載入
onMounted(() => {
  loadTeams()
})
</script>
