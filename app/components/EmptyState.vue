<template>
  <div
    class="flex flex-col items-center justify-center py-16 text-center text-gray-500"
  >
    <UIcon v-if="icon" :name="icon" class="mb-4 h-12 w-12 text-gray-400" />
    <div class="mb-2 text-xl font-semibold">{{ title }}</div>
    <div v-if="description" class="mb-4 text-base">{{ description }}</div>
    <div v-if="$slots.default">
      <slot />
    </div>
    <div v-if="$slots.actions" class="mt-4">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * EmptyState component for displaying empty or error states.
 * @prop icon - Lucide icon name (e.g. 'i-lucide-calendar-x')
 * @prop title - Main title text
 * @prop description - Optional description text
 */
defineProps<{
  icon?: string
  title: string
  description?: string
}>()
</script>

<style scoped>
/* 可依設計調整 spacing/color */
</style>
