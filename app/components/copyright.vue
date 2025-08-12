<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    since?: number
    until?: number
    author?: string
    url?: string
    long?: boolean
  }>(),
  {
    since: new Date().getFullYear(),
    until: new Date().getFullYear(),
  },
)
const { since, until, author, url, long } = props
const year = until > (since ?? until) ? `${since} - ${until}` : `${until}`
</script>

<template>
  <div>
    <span v-if="long"
      >Copyright &copy; {{ year }} <ULink :to="url">{{ author }}</ULink
      >. All rights reserved.</span
    >
    <span v-else
      >&copy; {{ year }} <ULink :to="url">{{ author }}</ULink></span
    >
  </div>
</template>

<style scoped></style>
