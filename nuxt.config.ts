// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  modules: ['@element-plus/nuxt'],
  elementPlus: {
    icon: 'ElIcon'
  },
  css: ['normalize.css'],
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "@/assets/animation.scss" as *;'
        }
      }
    }
  }
})
