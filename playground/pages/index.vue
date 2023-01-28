<template>
  <div class="container">
    测试一下
    <button @click="test">
      点击test
    </button>
  </div>
</template>
<script setup lang="ts">
const test = () => {
  $fetch('/api/get-ip')
}
</script>
<style lang="less" scoped>
</style>
