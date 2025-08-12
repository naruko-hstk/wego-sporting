<template>
  <div class="space-y-4">
    <!-- 第一層：類型（品勢/對打） -->
    <UAccordion :key="componentKey" :items="typeItems">
      <template #content="{ item: typeItem }">
        <!-- 第二層：組別，使用 pl-4 縮排 -->
        <div class="pl-4">
          <UAccordion :items="getGroupItems(typeItem.key)">
            <template #content="{ item: groupItem }">
              <!-- 第三層：等級/量級，使用 pl-4 再次縮排 -->
              <div class="space-y-3 pl-4">
                <div
                  v-for="category in getCategoriesForGroup(
                    typeItem.key,
                    groupItem.key,
                  )"
                  :key="category.id"
                >
                  <div class="rounded-lg border p-4">
                    <div class="mb-3 font-medium">
                      {{ category.categoryName }}
                    </div>

                    <!-- 參賽方式選擇 -->
                    <div class="mb-4">
                      <URadioGroup
                        :model-value="categoryInputMethods[category.id]"
                        :options="[
                          {
                            value: 'team-members',
                            label: '選擇隊員',
                            disabled: formData.selectedTeamId === 'custom',
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
                            $event as 'team-members' | 'manual',
                          )
                        "
                      />
                    </div>

                    <!-- 隊員選擇區域 -->
                    <div
                      v-if="
                        categoryInputMethods[category.id] === 'team-members'
                      "
                    >
                      <div
                        v-if="formData.selectedTeamId === 'custom'"
                        class="mb-2 text-sm text-gray-500"
                      >
                        <UTooltip text="此功能只能在選擇隊伍時使用">
                          <span class="cursor-help">
                            選擇隊員功能不可用（需先選擇隊伍）
                          </span>
                        </UTooltip>
                      </div>
                      <div
                        v-else-if="
                          getFilteredTeamMemberOptions(category.id).length === 0
                        "
                        class="mb-2 text-sm text-gray-500"
                      >
                        <div class="flex items-center space-x-1">
                          <Icon
                            name="i-heroicons-information-circle"
                            class="h-4 w-4"
                          />
                          <span>
                            該隊伍沒有符合此組別條件的隊員
                            <span
                              v-if="
                                category.categoryName.includes('男子組') ||
                                category.categoryName.includes('男生組') ||
                                category.categoryName.includes('男組') ||
                                category.conditions?.includes('男性') ||
                                category.conditions?.includes('男')
                              "
                              class="text-blue-600"
                              >(需男性隊員)</span
                            >
                            <span
                              v-else-if="
                                category.categoryName.includes('女子組') ||
                                category.categoryName.includes('女生組') ||
                                category.categoryName.includes('女組') ||
                                category.conditions?.includes('女性') ||
                                category.conditions?.includes('女')
                              "
                              class="text-pink-600"
                              >(需女性隊員)</span
                            >
                          </span>
                        </div>
                      </div>
                      <div v-else>
                        <p class="mb-2 text-sm text-gray-600">選擇參賽隊員：</p>
                        <div class="grid grid-cols-1 gap-2 md:grid-cols-2">
                          <label
                            v-for="member in getFilteredTeamMemberOptions(
                              category.id,
                            )"
                            :key="member.id"
                            class="flex cursor-pointer items-center space-x-2"
                          >
                            <UCheckbox
                              :model-value="
                                formData.categoryMembers[category.id]?.some(
                                  (m: TeamMember) => m.id === member.id,
                                )
                              "
                              @change="
                                $emit('toggle-team-member', category.id, member)
                              "
                            />
                            <span class="text-sm">
                              {{ member.name }} ({{ member.role }}) -
                              {{
                                member.gender === "male"
                                  ? "男"
                                  : member.gender === "female"
                                    ? "女"
                                    : "未設定"
                              }}
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <!-- 手動輸入區域 -->
                    <div v-else class="space-y-3">
                      <div
                        v-for="(member, memberIndex) in formData
                          .categoryMembers[category.id]"
                        :key="memberIndex"
                        class="space-y-3 rounded border p-3"
                      >
                        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <UInput
                            v-model="member.name"
                            placeholder="姓名 *"
                            required
                          />
                          <UInput
                            v-model="member.role"
                            placeholder="角色"
                            value="選手"
                          />
                          <USelect
                            v-model="member.gender"
                            :items="[
                              { label: '男', value: 'male' },
                              { label: '女', value: 'female' },
                            ]"
                            placeholder="性別 *"
                            required
                          />
                          <UInput
                            v-model="member.birthday"
                            placeholder="生日"
                            type="date"
                          />
                          <UInput
                            v-model="member.phone"
                            placeholder="聯絡電話"
                          />
                          <UInput
                            v-model="member.email"
                            placeholder="電子信箱"
                            type="email"
                          />
                        </div>
                        <div class="flex justify-end">
                          <UButton
                            color="red"
                            variant="soft"
                            icon="i-heroicons-trash"
                            size="sm"
                            @click="
                              $emit(
                                'remove-category-member',
                                category.id,
                                memberIndex,
                              )
                            "
                          >
                            移除隊員
                          </UButton>
                        </div>
                      </div>

                      <UButton
                        variant="soft"
                        icon="i-heroicons-plus"
                        @click="$emit('add-category-member', category.id)"
                      >
                        新增隊員
                      </UButton>
                    </div>

                    <!-- 費用資訊 -->
                    <div class="mt-3 text-sm text-gray-600">
                      費用：NT$ {{ category.game_fee?.[0]?.amount || 0 }}
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </UAccordion>
        </div>
      </template>
    </UAccordion>
  </div>
</template>

<script setup lang="ts">
import type { AccordionItem } from "@nuxt/ui"

interface TeamMember {
  id?: string
  name: string
  role: string
  gender: string | undefined
  birthday?: string | null
  phone?: string | null
  email?: string | null
}

interface Category {
  id: string
  gameId: string
  categoryName: string
  conditions?: string | null
  createdAt: string
  updatedAt: string
  game_fee?: { amount: number; categoryId?: string }[]
}

interface FormData {
  teamName: string
  leader: TeamMember
  coach: TeamMember
  categoryMembers: Record<string, TeamMember[]>
  selectedTeamId?: string
  selectedCategoryId?: string
  note?: string
}

const props = defineProps<{
  organizedCategories: Record<string, Record<string, Record<string, Category>>>
  categoryInputMethods: Record<string, "team-members" | "manual">
  formData: FormData
  getFilteredTeamMemberOptions: (categoryId: string) => TeamMember[]
}>()

const emit = defineEmits<{
  "toggle-team-member": [categoryId: string, member: TeamMember]
  "add-category-member": [categoryId: string]
  "remove-category-member": [categoryId: string, index: number]
  "update-input-method": [categoryId: string, method: "team-members" | "manual"]
}>()

// 建立第一層 Accordion 項目（類型）
const typeItems = computed((): AccordionItem[] => {
  return Object.keys(props.organizedCategories).map((type) => ({
    label: type,
    key: type,
    defaultOpen: true,
  }))
})

// 建立第二層 Accordion 項目（組別）
const getGroupItems = (typeKey: string): AccordionItem[] => {
  const groups = props.organizedCategories[typeKey] || {}
  return Object.keys(groups).map((group) => ({
    label: group,
    key: group,
    parentKey: typeKey,
    defaultOpen: false,
  }))
}

// 取得特定組別下的分類
const getCategoriesForGroup = (
  typeKey: string,
  groupKey: string,
): Category[] => {
  const subCategories = props.organizedCategories[typeKey]?.[groupKey] || {}
  return Object.values(subCategories)
}

// 監聽隊伍變更，強制組件重新渲染
const componentKey = ref(0)

// 監聽 formData.selectedTeamId 變化
watch(
  () => props.formData.selectedTeamId,
  (newTeamId, oldTeamId) => {
    console.log("隊伍變更:", { from: oldTeamId, to: newTeamId })

    // 強制組件重新渲染
    componentKey.value++

    // 如果切換到手動輸入，確保所有組別都設為手動模式
    if (newTeamId === "custom") {
      // 通知父組件更新所有組別的輸入方式
      Object.keys(props.categoryInputMethods).forEach((categoryId) => {
        if (props.categoryInputMethods[categoryId] !== "manual") {
          emit("update-input-method", categoryId, "manual")
        }
      })
    }
  },
  { immediate: true },
)

// 監聽 formData.selectedTeamId 變化來重新渲染組件
watch(
  () => props.formData.selectedTeamId,
  (newTeamId, oldTeamId) => {
    console.log("選擇隊伍變更:", {
      from: oldTeamId,
      to: newTeamId,
    })

    // 強制組件重新渲染
    componentKey.value++
  },
  { immediate: true },
)

// 監聽 organizedCategories 變化
watch(
  () => props.organizedCategories,
  (newCategories) => {
    console.log("組織分類變更:", Object.keys(newCategories).length)

    // 強制組件重新渲染
    componentKey.value++
  },
  { deep: true, immediate: true },
)
</script>
