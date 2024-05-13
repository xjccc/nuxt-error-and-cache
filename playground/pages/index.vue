<template>
  <div class="container">
    测试一下
    <button @click="test">
      点击test
    </button>
  </div>
</template>

<script setup lang="ts">
console.log('index ')
console.log(ggg)

const test = () => {
  $fetch('/api/get-ip')
}
</script>

<style scoped>
</style>
