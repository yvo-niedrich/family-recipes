import type { Router } from 'vitepress'

// Makes new deployments reach phones reliably.
//
// 1. Browsers only check for a new service worker on full page loads. VitePress
//    navigates client-side and a home-screen app is usually just resumed, so we
//    also check whenever the app comes back to the foreground (and hourly).
// 2. With registerType 'autoUpdate' the new service worker takes over immediately
//    and deletes the old precache. The open page still runs the old JS, whose page
//    chunks no longer exist anywhere. So once a new version has taken over, the
//    next navigation becomes a full page load instead of a client-side one.
//    No reload while someone is reading a recipe.

const CHECK_THROTTLE_MS = 60 * 1000
const CHECK_INTERVAL_MS = 60 * 60 * 1000

export function setupServiceWorkerUpdates(router: Router) {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    const sw = navigator.serviceWorker

    // controllerchange also fires on the very first install (clientsClaim);
    // only a change from an existing controller means a new version.
    let hadController = !!sw.controller
    let updated = false
    sw.addEventListener('controllerchange', () => {
        if (hadController) updated = true
        hadController = true
    })

    // Covers link navigation (router.go) and back/forward (popstate).
    // The URL has already changed at this point, so a reload loads the target page.
    const previous = router.onBeforePageLoad
    router.onBeforePageLoad = async (href) => {
        if (updated) {
            window.location.reload()
            return false
        }
        return previous?.(href)
    }

    let lastCheck = 0
    const checkForUpdate = async () => {
        if (Date.now() - lastCheck < CHECK_THROTTLE_MS || !navigator.onLine) return
        lastCheck = Date.now()
        try {
            await (await sw.getRegistration())?.update()
        } catch {
            // offline or server unreachable: try again next time
        }
    }
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkForUpdate()
    })
    window.addEventListener('online', checkForUpdate)
    setInterval(checkForUpdate, CHECK_INTERVAL_MS)
}
