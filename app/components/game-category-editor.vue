<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-semibold">賽事分類管理</h2>
      <UButton icon="i-heroicons-plus" @click="showAddForm = true">
        新增分類
      </UButton>
    </div>

    <!-- 新增分類表單 -->
    <UCard v-if="showAddForm" class="border border-green-200 bg-green-50">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-medium">新增賽事分類</h3>
          <UButton
            icon="i-heroicons-x-mark"
            color="gray"
            variant="ghost"
            size="sm"
            @click="cancelAdd"
          />
        </div>
      </template>

      <form class="space-y-4" @submit.prevent="submitAdd">
        <UFormGroup label="組別名稱" required>
          <UInput
            v-model="newCategory.categoryName"
            placeholder="例如：國小男子組、高中女子品勢、成人混合組"
            required
          />
        </UFormGroup>

        <UFormGroup
          label="條件限制"
          description="選填，例如：年齡限制、性別限制、段級限制等"
        >
          <UTextarea
            v-model="newCategory.conditions"
            placeholder="例如：限12歲以下、限黑帶二段以上、限體重60公斤以下"
            rows="3"
          />
        </UFormGroup>

        <div class="flex gap-3">
          <UButton type="submit" :loading="addLoading"> 新增分類 </UButton>
          <UButton
            type="button"
            color="gray"
            variant="outline"
            @click="cancelAdd"
          >
            取消
          </UButton>
        </div>
      </form>
    </UCard>

    <!-- 現有分類列表 -->
    <div v-if="categories.length === 0" class="py-8 text-center text-gray-500">
      <UIcon
        name="i-heroicons-rectangle-stack"
        class="mx-auto mb-4 h-12 w-12"
      />
      <p>尚未新增任何分類</p>
    </div>

    <div v-else class="space-y-4">
      <UCard
        v-for="category in categories"
        :key="category.id"
        class="transition-shadow hover:shadow-md"
      >
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium">{{ category.categoryName }}</h3>
            <div class="flex gap-2">
              <UButton
                icon="i-heroicons-pencil"
                color="gray"
                variant="ghost"
                size="sm"
                @click="startEdit(category)"
              />
              <UButton
                icon="i-heroicons-trash"
                color="red"
                variant="ghost"
                size="sm"
                @click="confirmDelete(category)"
              />
            </div>
          </div>
        </template>

        <!-- 編輯模式 -->
        <div v-if="editingId === category.id">
          <form class="space-y-4" @submit.prevent="submitEdit">
            <UFormGroup label="組別名稱" required>
              <UInput v-model="editCategory.categoryName" required />
            </UFormGroup>

            <UFormGroup label="條件限制">
              <UTextarea v-model="editCategory.conditions" rows="3" />
            </UFormGroup>

            <div class="flex gap-3">
              <UButton type="submit" :loading="editLoading"> 儲存 </UButton>
              <UButton
                type="button"
                color="gray"
                variant="outline"
                @click="cancelEdit"
              >
                取消
              </UButton>
            </div>
          </form>
        </div>

        <!-- 檢視模式 -->
        <div v-else>
          <div v-if="category.conditions" class="mb-4 text-gray-600">
            <strong>條件限制：</strong>{{ category.conditions }}
          </div>
          <div v-else class="mb-4 text-gray-500">無特殊條件限制</div>

          <!-- 費用資訊 -->
          <div
            v-if="category.game_fee && category.game_fee.length > 0"
            class="border-t pt-4"
          >
            <h4 class="mb-2 font-medium">參賽費用：</h4>
            <div class="space-y-1">
              <div
                v-for="fee in category.game_fee"
                :key="fee.categoryId"
                class="text-gray-600"
              >
                NT$ {{ fee.amount.toLocaleString() }}
              </div>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- 刪除確認對話框 -->
    <UModal v-model="showDeleteConfirm">
      <UCard>
        <template #header>
          <h3 class="text-lg font-medium">確認刪除</h3>
        </template>

        <p class="mb-4">
          確定要刪除「{{ deletingCategory?.categoryName }}」這個分類嗎？
        </p>
        <p class="mb-4 text-sm text-red-600">
          ⚠️ 此操作無法復原，且會一併刪除相關的報名資料！
        </p>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              color="gray"
              variant="outline"
              @click="showDeleteConfirm = false"
            >
              取消
            </UButton>
            <UButton color="red" :loading="deleteLoading" @click="submitDelete">
              確認刪除
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
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

interface Props {
  gameId: string
  categories: Category[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  "category-added": [category: Category]
  "category-updated": [category: Category]
  "category-deleted": [categoryId: string]
}>()

// 新增分類
const showAddForm = ref(false)
const newCategory = ref({
  categoryName: "",
  conditions: "",
})
const addLoading = ref(false)

// 編輯分類
const editingId = ref<string | null>(null)
const editCategory = ref({
  categoryName: "",
  conditions: "",
})
const editLoading = ref(false)

// 刪除分類
const showDeleteConfirm = ref(false)
const deletingCategory = ref<Category | null>(null)
const deleteLoading = ref(false)

/**
 * Submit new category
 */
const submitAdd = async () => {
  if (!newCategory.value.categoryName.trim()) return

  addLoading.value = true
  try {
    const { data } = await $fetch("/api/game_category", {
      method: "POST",
      body: {
        gameId: props.gameId,
        categoryName: newCategory.value.categoryName.trim(),
        conditions: newCategory.value.conditions.trim() || null,
      },
    })

    emit("category-added", data)
    cancelAdd()
  } catch (error) {
    console.error("新增分類失敗:", error)
  } finally {
    addLoading.value = false
  }
}

/**
 * Cancel add form
 */
const cancelAdd = () => {
  showAddForm.value = false
  newCategory.value = {
    categoryName: "",
    conditions: "",
  }
}

/**
 * Start editing a category
 */
const startEdit = (category: Category) => {
  editingId.value = category.id
  editCategory.value = {
    categoryName: category.categoryName,
    conditions: category.conditions || "",
  }
}

/**
 * Submit edit
 */
const submitEdit = async () => {
  if (!editingId.value || !editCategory.value.categoryName.trim()) return

  editLoading.value = true
  try {
    const { data } = await $fetch(`/api/game_category/${editingId.value}`, {
      method: "PUT",
      body: {
        categoryName: editCategory.value.categoryName.trim(),
        conditions: editCategory.value.conditions.trim() || null,
      },
    })

    emit("category-updated", data)
    cancelEdit()
  } catch (error) {
    console.error("更新分類失敗:", error)
  } finally {
    editLoading.value = false
  }
}

/**
 * Cancel edit
 */
const cancelEdit = () => {
  editingId.value = null
  editCategory.value = {
    categoryName: "",
    conditions: "",
  }
}

/**
 * Confirm delete
 */
const confirmDelete = (category: Category) => {
  deletingCategory.value = category
  showDeleteConfirm.value = true
}

/**
 * Submit delete
 */
const submitDelete = async () => {
  if (!deletingCategory.value) return

  deleteLoading.value = true
  try {
    await $fetch(`/api/game_category/${deletingCategory.value.id}`, {
      method: "DELETE",
    })

    emit("category-deleted", deletingCategory.value.id)
    showDeleteConfirm.value = false
    deletingCategory.value = null
  } catch (error) {
    console.error("刪除分類失敗:", error)
  } finally {
    deleteLoading.value = false
  }
}
</script>
