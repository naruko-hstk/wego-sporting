<template>
  <div class="space-y-4">
    <div
      v-for="category in categories"
      :key="category.id"
      class="rounded-lg border p-4"
    >
      <div class="mb-3">
        <h3 class="font-medium">{{ category.categoryName }}</h3>
        <p v-if="category.conditions" class="mt-1 text-sm text-gray-600">
          條件限制：{{ category.conditions }}
        </p>
      </div>

      <!-- 參賽方式選擇 -->
      <div class="mb-4">
        <URadioGroup
          :model-value="categoryInputMethods[category.id]"
          :options="[
            {
              value: 'user-players',
              label: '選擇我的隊員',
              disabled: false,
            },
            {
              value: 'manual',
              label: '手動輸入',
            },
          ]"
          class="flex gap-4"
          @update:model-value="
            $emit(
              'update-input-method',
              category.id,
              $event as 'user-players' | 'manual',
            )
          "
        />
      </div>

      <!-- 隊員選擇區域 -->
      <div v-if="categoryInputMethods[category.id] === 'user-players'">
        <div v-if="availableUserPlayers.length === 0" class="py-4">
          <div class="flex items-center gap-2 text-orange-600">
            <UIcon name="i-heroicons-exclamation-triangle" class="h-4 w-4" />
            <span>您尚未新增任何隊員，請先到個人資料新增隊員資訊</span>
          </div>
        </div>
        <div v-else>
          <div class="mb-3 text-sm font-medium text-gray-700">
            選擇參賽隊員：
          </div>
          <div class="space-y-2">
            <div
              v-for="player in availableUserPlayers"
              :key="player.id"
              class="flex items-center gap-3"
            >
              <UCheckbox
                :model-value="isPlayerSelected(category.id, player.id)"
                @update:model-value="
                  togglePlayerSelection(category.id, player.id, $event)
                "
              />
              <div class="flex-1">
                <span class="font-medium">{{ player.name }}</span>
                <span class="ml-2 text-sm text-gray-500">
                  {{ player.gender === "M" ? "男" : "女" }}
                </span>
                <span class="ml-2 text-sm text-gray-500">
                  {{ calculateAge(player.birthday) }}歲
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 手動輸入區域 -->
      <div v-else-if="categoryInputMethods[category.id] === 'manual'">
        <div class="mb-3 text-sm font-medium text-gray-700">手動輸入隊員：</div>
        <div class="space-y-3">
          <div
            v-for="(member, index) in getManualMembers(category.id)"
            :key="index"
            class="flex items-start gap-3"
          >
            <UInput
              v-model="member.name"
              placeholder="隊員姓名"
              class="flex-1"
            />
            <USelect
              v-model="member.gender"
              :options="[
                { label: '男', value: 'M' },
                { label: '女', value: 'F' },
              ]"
              placeholder="性別"
              class="w-20"
            />
            <UInput
              v-model="member.age"
              type="number"
              placeholder="年齡"
              class="w-20"
            />
            <UButton
              icon="i-heroicons-trash"
              color="red"
              variant="ghost"
              size="sm"
              @click="removeManualMember(category.id, index)"
            />
          </div>
          <UButton
            icon="i-heroicons-plus"
            variant="outline"
            size="sm"
            @click="addManualMember(category.id)"
          >
            新增隊員
          </UButton>
        </div>
      </div>

      <!-- 費用資訊 -->
      <div
        v-if="category.game_fee && category.game_fee.length > 0"
        class="mt-4 border-t pt-3"
      >
        <div class="mb-2 text-sm font-medium text-gray-700">參賽費用：</div>
        <div class="space-y-1">
          <div
            v-for="fee in category.game_fee"
            :key="fee.categoryId"
            class="text-sm text-gray-600"
          >
            NT$ {{ fee.amount.toLocaleString() }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Category {
  id: string
  gameId: string
  categoryName: string
  conditions?: string | null
  createdAt: string
  updatedAt: string
  game_fee?: { amount: number; categoryId?: string }[]
}

interface UserPlayer {
  id: string
  name: string
  gender: "M" | "F"
  birthday: string
}

interface ManualMember {
  name: string
  gender: "M" | "F" | ""
  age: string
}

interface Props {
  categories: Category[]
  availableUserPlayers: UserPlayer[]
  categoryInputMethods: Record<string, "user-players" | "manual">
  selectedPlayers: Record<string, string[]> // categoryId -> playerIds[]
  manualMembers: Record<string, ManualMember[]> // categoryId -> members[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  "update-input-method": [categoryId: string, method: "user-players" | "manual"]
  "toggle-player-selection": [
    categoryId: string,
    playerId: string,
    selected: boolean,
  ]
  "update-manual-members": [categoryId: string, members: ManualMember[]]
}>()

/**
 * Calculate age from birthday
 */
const calculateAge = (birthday: string): number => {
  const birthDate = new Date(birthday)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--
  }

  return age
}

/**
 * Check if a player is selected for a category
 */
const isPlayerSelected = (categoryId: string, playerId: string): boolean => {
  return props.selectedPlayers[categoryId]?.includes(playerId) || false
}

/**
 * Toggle player selection
 */
const togglePlayerSelection = (
  categoryId: string,
  playerId: string,
  selected: boolean,
) => {
  emit("toggle-player-selection", categoryId, playerId, selected)
}

/**
 * Get manual members for a category
 */
const getManualMembers = (categoryId: string): ManualMember[] => {
  return props.manualMembers[categoryId] || []
}

/**
 * Add a new manual member
 */
const addManualMember = (categoryId: string) => {
  const currentMembers = getManualMembers(categoryId)
  const newMembers = [
    ...currentMembers,
    { name: "", gender: "" as "M" | "F" | "", age: "" },
  ]
  emit("update-manual-members", categoryId, newMembers)
}

/**
 * Remove a manual member
 */
const removeManualMember = (categoryId: string, index: number) => {
  const currentMembers = getManualMembers(categoryId)
  const newMembers = currentMembers.filter((_, i) => i !== index)
  emit("update-manual-members", categoryId, newMembers)
}
</script>
