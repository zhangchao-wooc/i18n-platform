// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  modules: ['@element-plus/nuxt'],
  elementPlus: {
    importStyle: "scss",
    icon: 'ElIcon'
  },
  // components: false,
  css: ['normalize.css'],
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "@/assets/theme.scss" as *;'
        }
      }
    }
  },
  nitro: {
    storage: {
      'redis': {
        driver: 'redis',
        /* redis connector options */
        port: 6379, // Redis port
        host: "127.0.0.1", // Redis host
        username: "", // needs Redis >= 6
        password: "",
        db: 0, // Defaults to 0
        // tls: {} // tls/ssl
      }
    }
  }
  
})
