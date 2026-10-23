<script setup lang="ts">
// Ingredient checklist for shopping.
// Works on the rendered recipe HTML, so recipes stay plain Markdown.
import { onContentUpdated, useData } from 'vitepress'
import { onMounted } from 'vue'

const { page } = useData()

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

function setup() {
    const slug = page.value.relativePath.match(/^recipes\/(.+)\.md$/)?.[1]
    const content = document.querySelector('.vp-doc')
    if (!slug || !content || content.querySelector('.ingredient-reset')) return

    const sections = ingredientItems(content)
    if (!sections.length) return

    const key = `recipe-checked:${slug}`
    const items = sections.flatMap((s) => s.items)
    const checked = new Set<number>(JSON.parse(storageGet(key) ?? '[]'))

    // Lives inside the "Zutaten" heading; `ignore-header` keeps it out of the outline.
    const reset = document.createElement('button')
    reset.type = 'button'
    reset.className = 'ingredient-reset ignore-header'

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

    sections[0].heading.classList.add('has-ingredient-reset')
    sections[0].heading.append(reset)
}

onContentUpdated(setup)
onMounted(setup)
</script>

<template>
    <span hidden />
</template>
