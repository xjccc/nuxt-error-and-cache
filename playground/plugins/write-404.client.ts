import { defineNuxtPlugin, useRequestHeaders } from '#imports'
export default defineNuxtPlugin(() => {
  const headers = useRequestHeaders()
  return {
    provide: {
      write404: () => $fetch('/api/nuxt/write-404', {
        method: 'post',
        credentials: 'include',
        headers: headers as HeadersInit,
        body: {
          url: window.location.href
        }
      })
    }
  }
})
