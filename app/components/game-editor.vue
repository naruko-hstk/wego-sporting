<script setup lang="ts">
import type { Game } from "~/types/game"

interface Props {
  modelValue: boolean
  game?: Game | null
}

interface Emits {
  (e: "update:modelValue", value: boolean): void
  (e: "saved"): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 表單資料
const form = ref({
  name: "",
  region: "",
  venue: "",
  address: "",
  signupStart: "",
  signupEnd: "",
  gameStart: "",
  gameEnd: "",
  // 新增的欄位
  description: "",
  basis: "",
  note: "",
  feeInfo: "",
})

// 賽事分類表單
const categories = ref<
  Array<{
    id?: string
    type: string // 競賽類型：品勢、對打
    ageGroup: string // 組別：手動填寫，例如：高中男子組
    gender: string // 性別：個人、雙人、團體（品勢），個人、團體（對打）
    weightClass: string // 量級（僅對打需要）
    fullName: string // 自動生成的完整名稱
  }>
>([])

// 賽事費用表單
const fees = ref<
  Array<{
    id?: string
    categoryIndex?: number // 關聯的分類索引
    type: string
    amount: number
    description: string
  }>
>([])

// 當前編輯的分類/費用
const editingCategoryIndex = ref(-1)
const editingFeeIndex = ref(-1)

// 分頁狀態
const currentTab = ref("basic")

// 分頁選項
const tabs = [
  { value: "basic", label: "基本資訊", icon: "i-lucide-info" },
  { value: "details", label: "詳細說明", icon: "i-lucide-file-text" },
  { value: "categories", label: "賽事分類", icon: "i-lucide-list" },
  { value: "fees", label: "費用設定", icon: "i-lucide-dollar-sign" },
]

// 競賽類型選項（目前僅開放品勢和對打）
const categoryTypeOptions = [
  { label: "品勢", value: "品勢" },
  { label: "對打", value: "對打" },
  // 未來可能會擴充其他類型
  // { label: "威力擊破", value: "威力擊破" },
  // { label: "特技", value: "特技" },
]

// 組別選項（取代原本年齡組功能，改為手動填寫）
// 暫時註解掉，未來試點完畢後可能恢復下拉選單
// const ageGroupOptions = [
//   { label: "幼兒", value: "幼兒" },
//   { label: "國小", value: "國小" },
//   { label: "國中", value: "國中" },
//   { label: "高中", value: "高中" },
//   { label: "大專", value: "大專" },
//   { label: "社會", value: "社會" },
// ]

// 性別選項（改為個人、雙人、團體）
// 注意：這個選項現在用於"性別"欄位，實際上是組別形式
// const genderOptions = [
//   { label: "個人", value: "個人" },
//   { label: "雙人", value: "雙人" },
//   { label: "團體", value: "團體" },
// ]

// 組別形式選項（根據競賽類型動態顯示）
const getGroupOptions = (type: string) => {
  if (type === "品勢") {
    return [
      { label: "個人", value: "個人" },
      { label: "雙人", value: "雙人" },
      { label: "團體", value: "團體" },
    ]
  }
  if (type === "對打") {
    return [
      { label: "個人", value: "個人" },
      { label: "團體", value: "團體" },
    ]
  }
  // 預設情況
  return [{ label: "個人", value: "個人" }]
}

// 表單驗證狀態
const isSubmitting = ref(false)

// Modal 控制
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit("update:modelValue", value)
    // 關閉 Modal 時重置分頁到第一頁
    if (!value) {
      currentTab.value = "basic"
    }
  },
})

// 工具 composables
const { getRegionOptions } = useRegion()

// 地區選項
const regionOptions = getRegionOptions()

// 監聽 Modal 開啟狀態
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      // 每次打開 Modal 時重置到第一頁
      currentTab.value = "basic"
    }
  },
)

// 監聽 game prop 變化
watch(
  () => props.game,
  async (game) => {
    // 重置分頁到第一頁
    currentTab.value = "basic"

    if (game) {
      // 編輯模式：填入現有資料
      form.value = {
        name: game.name,
        region: game.region,
        venue: game.venue,
        address: game.address,
        signupStart: new Date(game.signupStart).toISOString().slice(0, 16),
        signupEnd: new Date(game.signupEnd).toISOString().slice(0, 16),
        gameStart: new Date(game.gameStart).toISOString().slice(0, 16),
        gameEnd: new Date(game.gameEnd).toISOString().slice(0, 16),
        description: "",
        basis: "",
        note: "",
        feeInfo: "",
      }

      // 載入現有的分類和費用資料
      try {
        // 載入分類
        const categoriesData = await $fetch(
          `/api/game_category?gameId=${game.id}`,
        )
        if (categoriesData && Array.isArray(categoriesData)) {
          categories.value = categoriesData.map((cat: unknown) => ({
            id: String((cat as any).id),
            type: String((cat as any).type),
            ageGroup: String((cat as any).group || ""), // 資料庫的 group 對應新版的 ageGroup
            gender: String((cat as any).level || ""), // 資料庫的 level 對應新版的 gender
            weightClass: String((cat as any).weightClass || ""),
            fullName: String((cat as any).fullName),
          }))
        }

        // 載入費用
        const feesData = await $fetch(`/api/game_fee?gameId=${game.id}`)
        if (feesData && Array.isArray(feesData)) {
          // 根據分類順序建立費用，每個分類對應一個費用項目
          fees.value = categories.value.map((category, index) => {
            // 嘗試找到對應的費用資料
            const matchingFee = feesData.find(
              (fee: unknown) =>
                (fee as any).feeType === category.fullName ||
                (fee as any).categoryId === category.id,
            )

            return {
              id: matchingFee ? (matchingFee as any).id : undefined,
              categoryIndex: index, // 對應到分類索引
              type:
                category.fullName ||
                `${category.ageGroup}${category.gender}${category.type}`,
              amount: matchingFee ? Number((matchingFee as any).amount) : 0,
              description: matchingFee
                ? (matchingFee as any).description || ""
                : "",
            }
          })
        } else {
          // 如果沒有費用資料，為每個分類建立空的費用項目
          fees.value = categories.value.map((category, index) => ({
            categoryIndex: index,
            type:
              category.fullName ||
              `${category.ageGroup}${category.gender}${category.type}`,
            amount: 0,
            description: "",
          }))
        }

        // 載入詳細資料
        const detailData = await $fetch(`/api/game_detail?gameId=${game.id}`)
        if (detailData) {
          form.value.description = (detailData as any).description || ""
          form.value.basis = (detailData as any).basis || ""
          form.value.note = (detailData as any).note || ""
          form.value.feeInfo = (detailData as any).feeInfo || ""
        }
      } catch (error) {
        console.warn("載入賽事詳細資料失敗:", error)
      }
    } else {
      // 新增模式：重置表單
      form.value = {
        name: "",
        region: "",
        venue: "",
        address: "",
        signupStart: "",
        signupEnd: "",
        gameStart: "",
        gameEnd: "",
        description: "",
        basis: "",
        note: "",
        feeInfo: "",
      }
      categories.value = []
      fees.value = []
    }
  },
  { immediate: true },
)

// 表單驗證
const isValid = computed(() => {
  return (
    form.value.name.trim() &&
    form.value.region &&
    form.value.venue.trim() &&
    form.value.address.trim() &&
    form.value.signupStart &&
    form.value.signupEnd &&
    form.value.gameStart &&
    form.value.gameEnd &&
    new Date(form.value.signupStart) < new Date(form.value.signupEnd) &&
    new Date(form.value.signupEnd) <= new Date(form.value.gameStart) &&
    new Date(form.value.gameStart) <= new Date(form.value.gameEnd)
  )
})

// 分類管理函數
const addCategory = () => {
  const newCategory = {
    type: "",
    ageGroup: "",
    gender: "",
    weightClass: "",
    fullName: "",
  }
  categories.value.push(newCategory)

  // 同時添加對應的費用項目
  const newFee = {
    categoryIndex: categories.value.length - 1, // 關聯到分類
    type: "",
    amount: 0,
    description: "",
  }
  fees.value.push(newFee)

  editingCategoryIndex.value = categories.value.length - 1
}

const editCategory = (index: number) => {
  editingCategoryIndex.value = index
}

const removeCategory = (index: number) => {
  categories.value.splice(index, 1)

  // 同時刪除對應的費用項目
  const feeIndex = fees.value.findIndex((fee) => fee.categoryIndex === index)
  if (feeIndex !== -1) {
    fees.value.splice(feeIndex, 1)
  }

  // 更新剩餘費用項目的 categoryIndex
  fees.value.forEach((fee) => {
    if (fee.categoryIndex !== undefined && fee.categoryIndex > index) {
      fee.categoryIndex--
    }
  })

  if (editingCategoryIndex.value === index) {
    editingCategoryIndex.value = -1
  }
}

const saveCategoryEdit = () => {
  if (editingCategoryIndex.value >= 0) {
    const category = categories.value[editingCategoryIndex.value]
    if (category) {
      // 自動生成全名
      const parts = []

      // 根據競賽類型決定命名格式
      if (category.type === "品勢") {
        // 品勢：組別 + 性別
        // 例如：高中男子個人、社會女子團體、國小雙人
        parts.push(category.ageGroup, category.gender)
      } else if (category.type === "對打") {
        // 對打：組別 + 量級
        // 例如：青少年男子組45公斤級、國中女子組50公斤級
        if (category.weightClass) {
          parts.push(category.ageGroup, category.weightClass)
        } else {
          parts.push(category.ageGroup, category.gender)
        }
      } else {
        // 其他競賽類型：組別 + 性別
        parts.push(category.ageGroup, category.gender)
      }

      category.fullName = parts.filter(Boolean).join("")

      // 更新對應費用的類型
      const relatedFee = fees.value.find(
        (fee) => fee.categoryIndex === editingCategoryIndex.value,
      )
      if (relatedFee) {
        relatedFee.type =
          category.fullName ||
          `${category.ageGroup}${category.gender}${category.type}`
      }
    }
    editingCategoryIndex.value = -1
  }
}

// 費用管理函數
const addFee = () => {
  const newFee = {
    // 不設定 categoryIndex，表示這是獨立的費用項目
    type: "",
    amount: 0,
    description: "",
  }
  fees.value.push(newFee)
  editingFeeIndex.value = fees.value.length - 1
}

const editFee = (index: number) => {
  editingFeeIndex.value = index
}

const removeFee = (index: number) => {
  // 費用項目只能通過刪除分類來移除，不允許單獨刪除
  const fee = fees.value[index]
  if (fee && fee.categoryIndex !== undefined) {
    console.warn("費用項目只能通過刪除對應的分類來移除")
    return
  }

  // 如果是獨立費用項目（沒有關聯分類），才允許刪除
  fees.value.splice(index, 1)
  if (editingFeeIndex.value === index) {
    editingFeeIndex.value = -1
  }
}

const saveFeeEdit = () => {
  editingFeeIndex.value = -1
}

// 提交表單
const handleSubmit = async () => {
  if (!isValid.value) return

  isSubmitting.value = true
  const toast = useToast()

  try {
    const data = {
      ...form.value,
      signupStart: new Date(form.value.signupStart).toISOString(),
      signupEnd: new Date(form.value.signupEnd).toISOString(),
      gameStart: new Date(form.value.gameStart).toISOString(),
      gameEnd: new Date(form.value.gameEnd).toISOString(),
      // 包含分類和費用資料
      categories: categories.value.map((cat) => ({
        type: cat.type,
        group: cat.ageGroup, // 新版的 ageGroup 對應資料庫的 group
        level: cat.gender, // 新版的 gender 對應資料庫的 level
        weightClass: cat.weightClass || null,
        fullName: cat.fullName,
      })),
      fees: fees.value.map((fee) => ({
        type: fee.type,
        amount: fee.amount,
        description: fee.description || null,
        categoryIndex: fee.categoryIndex, // 傳送分類索引，讓後端建立關聯
      })),
    }

    if (props.game) {
      // 編輯現有賽事
      await $fetch(`/api/games/${props.game.id}`, {
        method: "PUT",
        body: data,
      })
      toast.add({
        title: "儲存成功",
        description: "賽事資訊已成功更新",
        color: "green",
      })
    } else {
      // 建立新賽事
      await $fetch("/api/games", {
        method: "POST",
        body: data,
      })
      toast.add({
        title: "建立成功",
        description: "新賽事已成功建立",
        color: "green",
      })
    }

    emit("saved")
    isOpen.value = false
  } catch (error: unknown) {
    console.error("儲存賽事失敗:", error)
    toast.add({
      title: "儲存失敗",
      description:
        error instanceof Error ? error.message : "儲存賽事時發生錯誤",
      color: "red",
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="game ? '編輯賽事' : '新增賽事'"
    description="設定賽事完整資訊"
  >
    <template #body>
      <div class="space-y-6">
        <!-- 分頁標籤 -->
        <UTabs
          v-model="currentTab"
          :items="tabs"
          :content="false"
          class="w-full"
        />

        <!-- 基本資訊 -->
        <div v-if="currentTab === 'basic'" class="space-y-4">
          <h4 class="font-medium text-gray-900 dark:text-gray-100">基本資訊</h4>

          <UFormField label="賽事名稱" required>
            <UInput
              v-model="form.name"
              name="gameName"
              placeholder="輸入賽事名稱"
              required
              aria-label="賽事名稱"
            />
          </UFormField>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="地區" required>
              <USelect
                v-model="form.region"
                name="gameRegion"
                :items="regionOptions"
                placeholder="選擇地區"
                required
                aria-label="賽事地區"
              />
            </UFormField>

            <UFormField label="場地名稱" required>
              <UInput
                v-model="form.venue"
                placeholder="輸入場地名稱"
                required
              />
            </UFormField>
          </div>

          <UFormField label="詳細地址" required>
            <UTextarea
              v-model="form.address"
              placeholder="輸入詳細地址"
              :rows="2"
              required
            />
          </UFormField>

          <!-- 時間設定 -->
          <h4 class="font-medium text-gray-900 dark:text-gray-100">時間設定</h4>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="報名開始時間" required>
              <UInput
                v-model="form.signupStart"
                name="signupStart"
                type="datetime-local"
                required
                aria-label="報名開始時間"
              />
            </UFormField>

            <UFormField label="報名結束時間" required>
              <UInput
                v-model="form.signupEnd"
                name="signupEnd"
                type="datetime-local"
                required
                aria-label="報名結束時間"
              />
            </UFormField>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="賽事開始時間" required>
              <UInput v-model="form.gameStart" type="datetime-local" required />
            </UFormField>

            <UFormField label="賽事結束時間" required>
              <UInput v-model="form.gameEnd" type="datetime-local" required />
            </UFormField>
          </div>
        </div>

        <!-- 詳細說明 -->
        <div v-else-if="currentTab === 'details'" class="space-y-4">
          <h4 class="font-medium text-gray-900 dark:text-gray-100">詳細說明</h4>

          <UFormField label="賽事描述">
            <UTextarea
              v-model="form.description"
              placeholder="輸入賽事描述"
              :rows="3"
            />
          </UFormField>

          <UFormField label="比賽依據">
            <UTextarea
              v-model="form.basis"
              placeholder="比賽依據或規則說明"
              :rows="3"
            />
          </UFormField>

          <UFormField label="備註事項">
            <UTextarea
              v-model="form.note"
              placeholder="其他注意事項"
              :rows="3"
            />
          </UFormField>

          <UFormField label="費用說明">
            <UTextarea
              v-model="form.feeInfo"
              placeholder="費用相關說明"
              :rows="2"
            />
          </UFormField>
        </div>

        <!-- 賽事分類 -->
        <div v-else-if="currentTab === 'categories'" class="space-y-4">
          <div class="flex items-center justify-between">
            <h4 class="font-medium text-gray-900 dark:text-gray-100">
              賽事分類
            </h4>
            <UButton icon="i-lucide-plus" size="sm" @click="addCategory">
              新增分類
            </UButton>
          </div>

          <div v-if="categories.length === 0" class="py-8 text-center">
            <UIcon
              name="i-lucide-list-x"
              class="mx-auto mb-4 h-12 w-12 text-gray-400"
            />
            <p class="text-gray-600 dark:text-gray-400">尚未建立任何分類</p>
            <UButton class="mt-2" @click="addCategory">新增第一個分類</UButton>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="(category, index) in categories"
              :key="index"
              class="rounded-lg border p-4"
            >
              <div
                v-if="editingCategoryIndex !== index"
                class="flex items-center justify-between"
              >
                <div>
                  <div class="font-medium">
                    {{ category.fullName || "未命名分類" }}
                  </div>
                  <div class="text-sm text-gray-600">
                    {{ category.type }} - {{ category.ageGroup
                    }}{{ category.gender }}
                    <span v-if="category.weightClass">
                      - {{ category.weightClass }}
                    </span>
                  </div>
                </div>
                <div class="flex gap-2">
                  <UButton
                    variant="ghost"
                    size="sm"
                    icon="i-lucide-edit"
                    @click="editCategory(index)"
                  />
                  <UButton
                    variant="ghost"
                    size="sm"
                    color="red"
                    icon="i-lucide-trash"
                    @click="removeCategory(index)"
                  />
                </div>
              </div>

              <div v-else class="space-y-3">
                <div class="grid gap-3 sm:grid-cols-2">
                  <UFormField label="競賽類型" required>
                    <USelect
                      v-model="category.type"
                      :items="categoryTypeOptions"
                      placeholder="選擇競賽類型"
                      @change="
                        () => {
                          if (category.type === '對打' && !category.gender) {
                            category.gender = '個人'
                          }
                        }
                      "
                    />
                  </UFormField>

                  <UFormField label="組別" required>
                    <UInput
                      v-model="category.ageGroup"
                      placeholder="手動輸入組別，例如：高中男子組"
                    />
                  </UFormField>
                </div>

                <div class="grid gap-3 sm:grid-cols-2">
                  <UFormField label="性別" required>
                    <USelect
                      v-model="category.gender"
                      :items="
                        category.type === '對打'
                          ? getGroupOptions('對打')
                          : getGroupOptions('品勢')
                      "
                      placeholder="選擇性別"
                    />
                  </UFormField>

                  <UFormField
                    v-if="category.type === '對打'"
                    label="量級"
                    required
                  >
                    <UInput
                      v-model="category.weightClass"
                      placeholder="輸入量級數字，例如：45、50、78以上"
                    />
                  </UFormField>
                </div>

                <div class="flex justify-end gap-2">
                  <UButton
                    variant="ghost"
                    size="sm"
                    @click="editingCategoryIndex = -1"
                  >
                    取消
                  </UButton>
                  <UButton size="sm" @click="saveCategoryEdit">儲存</UButton>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 費用設定 -->
        <div v-else-if="currentTab === 'fees'" class="space-y-4">
          <div class="flex items-center justify-between">
            <h4 class="font-medium text-gray-900 dark:text-gray-100">
              費用設定
            </h4>
            <div class="flex items-center gap-3">
              <div class="text-sm text-gray-500">
                費用項目會根據賽事分類自動產生
              </div>
              <UButton icon="i-lucide-plus" size="sm" @click="addFee">
                新增費用
              </UButton>
            </div>
          </div>

          <div v-if="fees.length === 0" class="py-8 text-center">
            <UIcon
              name="i-lucide-dollar-sign"
              class="mx-auto mb-4 h-12 w-12 text-gray-400"
            />
            <p class="text-gray-600 dark:text-gray-400">尚未有任何費用項目</p>
            <p class="mt-2 text-sm text-gray-500">
              可以在「賽事分類」頁面建立分類自動產生費用，或直接新增獨立費用項目
            </p>
            <UButton class="mt-3" @click="addFee">新增費用項目</UButton>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="(fee, index) in fees"
              :key="index"
              class="rounded-lg border p-4"
            >
              <div
                v-if="editingFeeIndex !== index"
                class="flex items-center justify-between"
              >
                <div>
                  <div class="font-medium">{{ fee.type || "未命名費用" }}</div>
                  <div class="text-sm text-gray-600">
                    NT$ {{ fee.amount?.toLocaleString() || 0 }}
                    <span v-if="fee.description">- {{ fee.description }}</span>
                  </div>
                  <div
                    v-if="fee.categoryIndex !== undefined"
                    class="text-xs text-blue-600"
                  >
                    關聯分類:
                    {{ categories[fee.categoryIndex]?.fullName || "未知分類" }}
                  </div>
                </div>
                <div class="flex gap-2">
                  <UButton
                    variant="ghost"
                    size="sm"
                    icon="i-lucide-edit"
                    @click="editFee(index)"
                  />
                  <UButton
                    v-if="fee.categoryIndex === undefined"
                    variant="ghost"
                    size="sm"
                    color="red"
                    icon="i-lucide-trash"
                    @click="removeFee(index)"
                  />
                  <UTooltip v-else text="請刪除對應的分類來移除此費用項目">
                    <UButton
                      variant="ghost"
                      size="sm"
                      color="gray"
                      icon="i-lucide-trash"
                      disabled
                    />
                  </UTooltip>
                </div>
              </div>

              <div v-else class="space-y-3">
                <!-- 顯示關聯的分類資訊 -->
                <div
                  v-if="fee.categoryIndex !== undefined"
                  class="rounded-md bg-blue-50 p-3 dark:bg-blue-900/20"
                >
                  <div class="text-sm text-blue-700 dark:text-blue-200">
                    <strong>關聯分類:</strong>
                    {{ categories[fee.categoryIndex]?.fullName || "未知分類" }}
                  </div>
                  <div class="text-xs text-blue-600 dark:text-blue-300">
                    費用類型會自動同步分類名稱
                  </div>
                </div>

                <div
                  v-if="fee.categoryIndex === undefined"
                  class="grid gap-3 sm:grid-cols-2"
                >
                  <UFormField label="費用類型" required>
                    <UInput
                      v-model="fee.type"
                      placeholder="輸入費用類型，例如：報名費、保險費"
                    />
                  </UFormField>
                </div>

                <div class="grid gap-3 sm:grid-cols-2">
                  <UFormField label="金額" required>
                    <UInput
                      v-model.number="fee.amount"
                      type="number"
                      placeholder="輸入金額"
                      min="0"
                    />
                  </UFormField>

                  <UFormField label="說明">
                    <UInput
                      v-model="fee.description"
                      placeholder="費用說明（可選）"
                    />
                  </UFormField>
                </div>

                <div class="flex justify-end gap-2">
                  <UButton
                    variant="ghost"
                    size="sm"
                    @click="editingFeeIndex = -1"
                  >
                    取消
                  </UButton>
                  <UButton size="sm" @click="saveFeeEdit">儲存</UButton>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 驗證提示 -->
        <div
          v-if="!isValid && currentTab === 'basic'"
          class="rounded-md bg-yellow-50 p-3 dark:bg-yellow-900/20"
        >
          <div class="flex items-start gap-2">
            <UIcon
              name="i-lucide-alert-triangle"
              class="mt-0.5 h-4 w-4 text-yellow-600"
            />
            <div class="text-sm text-yellow-700 dark:text-yellow-200">
              <p class="font-medium">請檢查以下項目：</p>
              <ul class="mt-1 list-inside list-disc space-y-1">
                <li v-if="!form.name.trim()">請輸入賽事名稱</li>
                <li v-if="!form.region">請選擇地區</li>
                <li v-if="!form.venue.trim()">請輸入場地名稱</li>
                <li v-if="!form.address.trim()">請輸入詳細地址</li>
                <li v-if="!form.signupStart">請設定報名開始時間</li>
                <li v-if="!form.signupEnd">請設定報名結束時間</li>
                <li v-if="!form.gameStart">請設定賽事開始時間</li>
                <li v-if="!form.gameEnd">請設定賽事結束時間</li>
                <li
                  v-if="
                    form.signupStart &&
                    form.signupEnd &&
                    new Date(form.signupStart) >= new Date(form.signupEnd)
                  "
                >
                  報名開始時間必須早於報名結束時間
                </li>
                <li
                  v-if="
                    form.signupEnd &&
                    form.gameStart &&
                    new Date(form.signupEnd) > new Date(form.gameStart)
                  "
                >
                  報名結束時間不能晚於賽事開始時間
                </li>
                <li
                  v-if="
                    form.gameStart &&
                    form.gameEnd &&
                    new Date(form.gameStart) > new Date(form.gameEnd)
                  "
                >
                  賽事開始時間必須早於賽事結束時間
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer="{ close }">
      <div class="flex justify-between">
        <div class="flex gap-2">
          <UButton
            v-if="currentTab !== 'basic'"
            variant="outline"
            @click="
              currentTab =
                tabs[tabs.findIndex((t) => t.value === currentTab) - 1]
                  ?.value || 'basic'
            "
          >
            上一步
          </UButton>
        </div>
        <div class="flex gap-2">
          <UButton variant="ghost" @click="close"> 取消 </UButton>
          <UButton
            v-if="currentTab !== 'fees'"
            @click="
              currentTab =
                tabs[tabs.findIndex((t) => t.value === currentTab) + 1]
                  ?.value || 'fees'
            "
          >
            下一步
          </UButton>
          <UButton
            v-else
            :disabled="!isValid"
            :loading="isSubmitting"
            @click="handleSubmit"
          >
            {{ game ? "儲存變更" : "建立賽事" }}
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
