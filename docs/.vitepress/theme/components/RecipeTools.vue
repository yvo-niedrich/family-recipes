<script setup lang="ts">
// Ingredient checklist for shopping and an optional "keep screen on" toggle for cooking.
// Works on the rendered recipe HTML, so recipes stay plain Markdown.
import { onContentUpdated, useData } from 'vitepress'
import { onMounted, onUnmounted } from 'vue'

const WAKE_LOCK_KEY = 'recipe-wake-lock'

const { page } = useData()

let wakeLock: WakeLockSentinel | null = null
let wakeLockWanted = false

function storageGet(key: string): string | null {
    try { return localStorage.getItem(key) } catch { return null }
}

function storageSet(key: string, value: string | null) {
    try {
        if (value === null) localStorage.removeItem(key)
        else localStorage.setItem(key, value)
    } catch { /* private mode etc. — the checklist just won't persist */ }
}

/** All list items between a "Zutaten" heading and the next heading of the same or higher level. */
function ingredientItems(root: Element): { heading: HTMLElement; items: HTMLLIElement[] }[] {
    const sections: { heading: HTMLElement; items: HTMLLIElement[] }[] = []
    root.querySelectorAll<HTMLElement>('h2, h3').forEach((heading) => {
        if (!/^\s*(Zutaten|Ingredients)/i.test(heading.textContent ?? '')) return
        const level = Number(heading.tagName[1])
        const items: HTMLLIElement[] = []
        for (let el = heading.nextElementSibling; el; el = el.nextElementSibling) {
            if (/^H[1-6]$/.test(el.tagName) && Number(el.tagName[1]) <= level) break
            if (el.tagName === 'UL' || el.tagName === 'OL') items.push(...el.querySelectorAll<HTMLLIElement>(':scope > li'))
        }
        if (items.length) sections.push({ heading, items })
    })
    return sections
}

async function acquireWakeLock() {
    if (!wakeLockWanted || wakeLock || document.visibilityState !== 'visible') return
    try {
        wakeLock = await navigator.wakeLock.request('screen')
        wakeLock.addEventListener('release', () => (wakeLock = null))
    } catch { /* e.g. battery saver; the toggle stays on and retries on the next visit */ }
}

function releaseWakeLock() {
    wakeLock?.release()
    wakeLock = null
}

// The lock is dropped whenever the page is hidden; take it again when coming back.
function onVisibilityChange() {
    if (document.visibilityState === 'visible') acquireWakeLock()
}

function setup() {
    const slug = page.value.relativePath.match(/^recipes\/(.+)\.md$/)?.[1]
    const content = document.querySelector('.vp-doc')
    if (content?.querySelector('.recipe-tools')) return // already set up for this page
    wakeLockWanted = false
    releaseWakeLock()
    if (!slug || !content) return

    const sections = ingredientItems(content)
    if (!sections.length) return

    const key = `recipe-checked:${slug}`
    const items = sections.flatMap((s) => s.items)
    const checked = new Set<number>(JSON.parse(storageGet(key) ?? '[]'))

    const tools = document.createElement('div')
    tools.className = 'recipe-tools'

    const reset = document.createElement('button')
    reset.type = 'button'
    tools.append(reset)

    const updateReset = () => {
        reset.hidden = checked.size === 0
        reset.textContent = `${checked.size} von ${items.length} abgehakt · zurücksetzen`
        storageSet(key, checked.size ? JSON.stringify([...checked]) : null)
    }

    items.forEach((li, index) => {
        li.classList.add('ingredient')
        li.setAttribute('role', 'checkbox')
        li.tabIndex = 0
        li.setAttribute('aria-checked', String(checked.has(index)))
        const toggle = () => {
            checked.has(index) ? checked.delete(index) : checked.add(index)
            li.setAttribute('aria-checked', String(checked.has(index)))
            updateReset()
        }
        li.addEventListener('click', (e) => {
            if ((e.target as HTMLElement).closest('a')) return
            toggle()
        })
        li.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault()
                toggle()
            }
        })
    })

    reset.addEventListener('click', () => {
        checked.clear()
        items.forEach((li) => li.setAttribute('aria-checked', 'false'))
        updateReset()
    })
    updateReset()

    if ('wakeLock' in navigator) {
        const awake = document.createElement('button')
        awake.type = 'button'
        awake.textContent = 'Bildschirm anlassen'
        awake.title = 'Verhindert, dass sich der Bildschirm beim Kochen ausschaltet'
        const apply = (on: boolean) => {
            wakeLockWanted = on
            awake.setAttribute('aria-pressed', String(on))
            on ? acquireWakeLock() : releaseWakeLock()
        }
        awake.addEventListener('click', () => {
            const on = awake.getAttribute('aria-pressed') !== 'true'
            storageSet(WAKE_LOCK_KEY, on ? '1' : null)
            apply(on)
        })
        apply(storageGet(WAKE_LOCK_KEY) === '1')
        tools.append(awake)
    }

    sections[0].heading.after(tools)
}

onContentUpdated(setup)
onMounted(() => {
    setup()
    document.addEventListener('visibilitychange', onVisibilityChange)
})
onUnmounted(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange)
    releaseWakeLock()
})
</script>

<template>
    <span hidden />
</template>
