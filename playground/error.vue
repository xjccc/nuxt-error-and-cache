<template>
  <div>错误页面</div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useNuxtApp, useRoute } from '#app'

const route = useRoute()

onMounted(() => {
  const { $write404 } = useNuxtApp()
  // $write404()

  console.log(oooo)
})
</script>

<style scoped>
</style>
