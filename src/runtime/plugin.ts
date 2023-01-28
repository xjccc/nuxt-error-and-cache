import { defineNuxtPlugin, useRequestHeaders, useRoute } from '#app'

export default defineNuxtPlugin((nuxtApp) => {
  const headers = useRequestHeaders()
  nuxtApp.vueApp.config.errorHandler = (error, context) => {
    const err = error as Error
    const route = useRoute()

    $fetch(`/api/nuxt/get-error?url=${route.path}`, {
      method: 'post',
      credentials: 'include',
      headers: headers as HeadersInit,
      body: {
        msg: err.message,
        stack: err.stack,
        url: route.path
      }
    })
  }
})
