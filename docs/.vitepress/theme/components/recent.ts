// Recently viewed recipes, newest first, kept in this browser only.
const KEY = 'recent-recipes'
const MAX = 12

export function readRecent(): string[] {
    try {
        const list = JSON.parse(localStorage.getItem(KEY) ?? '[]')
        return Array.isArray(list) ? list.filter((s) => typeof s === 'string') : []
    } catch {
        return []
    }
}

export function rememberRecipe(slug: string) {
    const list = [slug, ...readRecent().filter((s) => s !== slug)].slice(0, MAX)
    try { localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* private mode etc. */ }
}

export function clearRecent() {
    try { localStorage.removeItem(KEY) } catch { /* private mode etc. */ }
}
