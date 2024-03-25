<template>
  <NuxtPage />
</template>

<script setup>
import { useRuntimeConfig } from '#app'
const config = useRuntimeConfig()
console.log(config)
</script>
