<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script lang="ts" setup>
  import * as ElementPlusIconsVue from '@element-plus/icons-vue'
  // You might choose this based on an API call or logged-in status
  const layout = "main-content";
  
  const nuxtApp = useNuxtApp()
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    nuxtApp.vueApp.component(key, component)
  }
</script>

<style lang="scss">
  a {
    text-decoration: none;
  }
  
</style>
