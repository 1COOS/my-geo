import { registerSW } from 'virtual:pwa-register'

export function registerMyGeoServiceWorker() {
  if (!import.meta.env.PROD) return

  registerSW({
    immediate: true,
    onRegisterError(error) {
      console.error('My Geo service worker registration failed.', error)
    },
  })
}
