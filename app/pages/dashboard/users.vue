<script setup lang="ts">
import { h, resolveComponent } from "vue"
import { useUserManagement } from "~/composables/use-user-management"
import type { TableColumn, FormSubmitEvent } from "@nuxt/ui"
import * as z from "zod"

definePageMeta({
  layout: "dashboard",
})

const UBadge = resolveComponent("UBadge")
const USelect = resolveComponent("USelect")
const UDropdownMenu = resolveComponent("UDropdownMenu")
const UButton = resolveComponent("UButton")
const UAvatar = resolveComponent("UAvatar")

// 角色翻譯對照
const roleLabels = {
  user: "一般使用者",
  admin: "管理員",
  owner: "網站作者",
}

// 可選角色（排除 owner）
const selectableRoles = [
  { label: "一般使用者", value: "user" },
  { label: "管理員", value: "admin" },
]

// 新增使用者表單驗證 schema
const createUserSchema = z.object({
  username: z
    .string()
    .min(3, "使用者名稱至少需要3個字元")
    .max(30, "使用者名稱過長"),
  password: z.string().min(8, "密碼至少需要8個字元").max(100, "密碼過長"),
  email: z.email("請輸入有效的電子郵件地址"),
  role: z.enum(["admin", "user"]).default("user"),
  name: z.string().min(1, "請輸入使用者姓名").max(100, "使用者姓名過長"),
})

type CreateUserSchema = z.output<typeof createUserSchema>

// Composables
const {
  isLoading,
  error,
  users,
  listUsers,
  createUser,
  setUserRole,
  banUser,
  unbanUser,
  removeUser,
} = useUserManagement()

// Reactive state
const searchQuery = ref("")
const currentPage = ref(1)
const pageSize = ref(10)
const sortBy = ref("createdAt")
const sortDirection = ref<"asc" | "desc">("asc")

// Create user modal
const isCreateModalOpen = ref(false)
const createUserState = reactive<Partial<CreateUserSchema>>({
  username: "",
  password: "",
  email: "",
  role: "user",
  name: "",
})

// Computed
const totalPages = computed(() => {
  if (!users.value?.total) return 0
  return Math.ceil(users.value.total / pageSize.value)
})

const currentPageUsers = computed(() => {
  return users.value?.users || []
})

// 定義表格欄位
type User = {
  id: string
  name: string
  email: string
  image?: string
  role: "user" | "admin" | "owner"
  banned: boolean
  createdAt: string
  username?: string
}

const columns: TableColumn<User>[] = [
  {
    id: "user",
    header: () =>
      h(
        "div",
        {
          class:
            "flex items-center gap-1 cursor-pointer hover:text-primary-600 transition-colors",
          onClick: () => handleSort("name"),
        },
        [
          "使用者",
          sortBy.value === "name" &&
            h(
              "span",
              {
                class: "text-xs",
              },
              sortDirection.value === "asc" ? "↑" : "↓",
            ),
        ],
      ),
    cell: ({ row }) => {
      const user = row.original
      return h("div", { class: "flex items-center gap-3" }, [
        h(UAvatar, {
          src: user.image,
          alt: user.name,
          size: "sm",
        }),
        h("div", {}, [
          h("div", { class: "font-medium" }, user.name),
          user.username &&
            h(
              "div",
              { class: "text-sm text-muted-foreground" },
              `@${user.username}`,
            ),
        ]),
      ])
    },
  },
  {
    accessorKey: "email",
    header: () =>
      h(
        "div",
        {
          class:
            "flex items-center gap-1 cursor-pointer hover:text-primary-600 transition-colors",
          onClick: () => handleSort("email"),
        },
        [
          "電子郵件",
          sortBy.value === "email" &&
            h(
              "span",
              {
                class: "text-xs",
              },
              sortDirection.value === "asc" ? "↑" : "↓",
            ),
        ],
      ),
  },
  {
    id: "role",
    header: "角色",
    cell: ({ row }) => {
      const user = row.original
      const currentRole = user.role || "user"

      // 如果是 owner，只顯示標籤
      if (currentRole === "owner") {
        return h(
          UBadge,
          {
            color: "warning",
            variant: "soft",
          },
          () => roleLabels[currentRole],
        )
      }

      // 其他角色可以選擇
      return h(USelect, {
        modelValue: currentRole,
        items: selectableRoles,
        "onUpdate:modelValue": (value: string) => {
          handleRoleChange(user.id, value as "user" | "admin")
        },
      })
    },
  },
  {
    id: "status",
    header: "狀態",
    cell: ({ row }) => {
      const user = row.original
      return h(
        UBadge,
        {
          color: user.banned ? "error" : "success",
          variant: "soft",
        },
        () => (user.banned ? "已停用" : "正常"),
      )
    },
  },
  {
    id: "createdAt",
    header: () =>
      h(
        "div",
        {
          class:
            "flex items-center gap-1 cursor-pointer hover:text-primary-600 transition-colors",
          onClick: () => handleSort("createdAt"),
        },
        [
          "註冊時間",
          sortBy.value === "createdAt" &&
            h(
              "span",
              {
                class: "text-xs",
              },
              sortDirection.value === "asc" ? "↑" : "↓",
            ),
        ],
      ),
    cell: ({ row }) => {
      const user = row.original
      return new Date(user.createdAt).toLocaleDateString("zh-TW")
    },
  },
  {
    id: "actions",
    header: "操作",
    cell: ({ row }) => {
      const user = row.original
      const items = [
        [
          {
            label: user.banned ? "解除停用" : "停用使用者",
            icon: user.banned ? "i-lucide-unlock" : "i-lucide-lock",
            onClick: () =>
              user.banned ? handleUnbanUser(user.id) : handleBanUser(user.id),
          },
        ],
        [
          {
            label: "刪除使用者",
            icon: "i-lucide-trash-2",
            color: "error",
            onClick: () => handleRemoveUser(user.id),
          },
        ],
      ]

      return h(
        "div",
        { class: "text-right" },
        h(UDropdownMenu, { items }, () =>
          h(UButton, {
            variant: "ghost",
            size: "sm",
            icon: "i-lucide-more-horizontal",
          }),
        ),
      )
    },
  },
]

// Methods
const loadUsers = async () => {
  try {
    await listUsers({
      searchValue: searchQuery.value || undefined,
      searchField: "name",
      searchOperator: "contains",
      limit: pageSize.value,
      offset: (currentPage.value - 1) * pageSize.value,
      sortBy: sortBy.value,
      sortDirection: sortDirection.value,
    })
  } catch (err) {
    console.error("Load users error:", err)
  }
}

const handleCreateUser = async (event: FormSubmitEvent<CreateUserSchema>) => {
  const result = await createUser(event.data)
  if (result) {
    isCreateModalOpen.value = false
    // 重置表單狀態
    Object.assign(createUserState, {
      username: "",
      password: "",
      email: "",
      role: "user",
      name: "",
    })
    await loadUsers()
  }
}

const handleRoleChange = async (userId: string, newRole: "user" | "admin") => {
  await setUserRole(userId, newRole)
}

const handleBanUser = async (userId: string) => {
  const reason = prompt("請輸入停用原因：")
  if (reason !== null) {
    await banUser(userId, reason)
  }
}

const handleUnbanUser = async (userId: string) => {
  await unbanUser(userId)
}

const handleRemoveUser = async (userId: string) => {
  if (confirm("確定要刪除此使用者嗎？此操作無法復原。")) {
    await removeUser(userId)
  }
}

const goToPage = (page: number) => {
  currentPage.value = page
  loadUsers()
}

// 處理排序變更
const handleSort = (column: string) => {
  if (sortBy.value === column) {
    // 如果點擊同一欄位，切換排序方向
    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc"
  } else {
    // 如果點擊不同欄位，設定為該欄位並使用預設方向（升序）
    sortBy.value = column
    sortDirection.value = "asc"
  }
  currentPage.value = 1 // 重置到第一頁
  loadUsers()
}

// Watch for search changes
watch(searchQuery, () => {
  currentPage.value = 1
  loadUsers()
})

// Load initial data
onMounted(() => {
  loadUsers()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">帳號管理</h1>
        <p class="text-muted-foreground">管理系統中的所有使用者帳號</p>
      </div>
      <div class="flex gap-2">
        <UButton icon="i-lucide-user-plus" @click="isCreateModalOpen = true">
          新增使用者
        </UButton>
      </div>
    </div>

    <!-- Search and Filters -->
    <div class="flex items-center gap-4">
      <div class="flex-1">
        <UInput
          v-model="searchQuery"
          placeholder="搜尋使用者名稱..."
          icon="i-lucide-search"
        />
      </div>
      <USelect
        v-model="pageSize"
        :items="[
          { label: '10 筆', value: 10 },
          { label: '25 筆', value: 25 },
          { label: '50 筆', value: 50 },
        ]"
        @change="loadUsers"
      />
    </div>

    <!-- Error Alert -->
    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      :title="error"
      icon="i-lucide-alert-circle"
    />

    <!-- Users Table -->
    <UTable
      :data="currentPageUsers as User[]"
      :columns="columns"
      :loading="isLoading"
      :empty-state="{
        icon: 'i-lucide-users',
        label: '沒有找到使用者',
        description: '目前沒有任何使用者資料',
      }"
      class="flex-1"
    />

    <!-- Pagination -->
    <div
      v-if="totalPages > 1"
      class="border-border flex items-center justify-between border-t px-4 py-3"
    >
      <div class="text-muted-foreground text-sm">
        顯示 {{ (currentPage - 1) * pageSize + 1 }} -
        {{ Math.min(currentPage * pageSize, users?.total || 0) }} 筆， 共
        {{ users?.total || 0 }} 筆
      </div>
      <div class="flex items-center gap-2">
        <UButton
          variant="ghost"
          size="sm"
          icon="i-lucide-chevron-left"
          :disabled="currentPage === 1"
          @click="goToPage(currentPage - 1)"
        />
        <template v-for="page in totalPages" :key="page">
          <UButton v-if="page === currentPage" size="sm" variant="solid">
            {{ page }}
          </UButton>
          <UButton
            v-else-if="Math.abs(page - currentPage) <= 2"
            size="sm"
            variant="ghost"
            @click="goToPage(page)"
          >
            {{ page }}
          </UButton>
        </template>
        <UButton
          variant="ghost"
          size="sm"
          icon="i-lucide-chevron-right"
          :disabled="currentPage === totalPages"
          @click="goToPage(currentPage + 1)"
        />
      </div>
    </div>

    <!-- Create User Modal -->
    <UModal
      v-model:open="isCreateModalOpen"
      title="新增使用者"
      :ui="{ footer: 'justify-end' }"
    >
      <template #body>
        <UForm
          id="create-user-form"
          :schema="createUserSchema"
          :state="createUserState"
          class="space-y-4"
          @submit="handleCreateUser"
        >
          <!-- 第一行：使用者名稱 + 密碼 -->
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="使用者名稱" name="username" required>
              <UInput
                v-model="createUserState.username"
                placeholder="請輸入使用者名稱"
              />
            </UFormField>

            <UFormField label="密碼" name="password" required>
              <UInput
                v-model="createUserState.password"
                type="password"
                placeholder="請輸入密碼"
              />
            </UFormField>
          </div>

          <!-- 第二行：信箱 + 角色 -->
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="電子郵件" name="email" required>
              <UInput
                v-model="createUserState.email"
                type="email"
                placeholder="請輸入電子郵件"
              />
            </UFormField>

            <UFormField label="角色" name="role">
              <USelect
                v-model="createUserState.role"
                :items="selectableRoles"
              />
            </UFormField>
          </div>

          <!-- 第三行：姓名 -->
          <UFormField label="姓名" name="name" required>
            <UInput
              v-model="createUserState.name"
              placeholder="請輸入使用者姓名"
            />
          </UFormField>
        </UForm>
      </template>

      <template #footer="{ close }">
        <UButton variant="outline" color="neutral" @click="close">
          取消
        </UButton>
        <UButton :loading="isLoading" type="submit" form="create-user-form">
          建立使用者
        </UButton>
      </template>
    </UModal>
  </div>
</template>
