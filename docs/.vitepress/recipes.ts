import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'

export interface Recipe {
    slug: string
    url: string
    name: string
    categories: string[]
    tags: string[]
    preview: string | null
    /** Unix ms of the first commit that added the recipe. */
    added: number
    /** Unix ms of the last commit that changed the recipe. */
    updated: number
}

const docsDir = fileURLToPath(new URL('..', import.meta.url))
const repoRoot = path.resolve(docsDir, '..')
export const recipesDir = path.join(docsDir, 'recipes')

/** Order of categories in the sidebar and overview; unknown ones are appended alphabetically. */
const CATEGORY_ORDER = [
    'Frühstück', 'Vorspeise', 'Hauptgericht', 'Beilage', 'Salat', 'Snacks',
    'Dessert', 'Kuchen', 'Getränk', 'Sonstige',
]

export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/ß/g, 'ss').replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
        .normalize('NFKD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
}

/** Frontmatter lists are comma-separated strings ("Dessert, Kuchen"); YAML arrays work too. */
function splitList(value: unknown): string[] {
    const items = Array.isArray(value) ? value : String(value ?? '').split(',')
    return items.map((v) => String(v).trim()).filter(Boolean)
}

/** Commits listed in .git-blame-ignore-revs (e.g. line-ending normalization) don't count as edits. */
function ignoredRevs(): Set<string> {
    const file = path.join(repoRoot, '.git-blame-ignore-revs')
    if (!fs.existsSync(file)) return new Set()
    return new Set(
        fs.readFileSync(file, 'utf8').split('\n').map((l) => l.replace(/#.*/, '').trim()).filter(Boolean),
    )
}

/**
 * Reads added/updated dates for all recipes from a single `git log` walk.
 * Pure renames (R100) are followed but don't count as edits, so moving files
 * around keeps their original dates.
 */
function gitDates(files: string[]): Map<string, { added: number; updated: number }> {
    const dates = new Map<string, { added: number; updated: number }>()
    let log = ''
    try {
        log = execFileSync(
            'git',
            ['-c', 'core.quotepath=off', 'log', '-M', '--name-status', '--format=@@%H %at', '--', 'docs/recipes'],
            { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
        )
    } catch {
        return dates // not a git checkout; callers fall back to file mtime
    }

    const ignored = ignoredRevs()
    // Path as it was at the current point in history → current file path.
    const alias = new Map(files.map((f) => [f, f]))
    let hash = ''
    let time = 0

    for (const line of log.split('\n')) {
        if (line.startsWith('@@')) {
            const [h, t] = line.slice(2).split(' ')
            hash = h
            time = Number(t) * 1000
            continue
        }
        if (!line.trim()) continue

        const [status, a, b] = line.split('\t')
        const current = alias.get(status.startsWith('R') ? b : a)
        if (!current) continue

        if (status.startsWith('R')) alias.set(a, current)
        const isEdit = !ignored.has(hash) && status !== 'R100'
        const entry = dates.get(current) ?? { added: time, updated: 0 }
        entry.added = time // walking newest → oldest, so the last write is the oldest commit
        if (isEdit && !entry.updated) entry.updated = time
        dates.set(current, entry)
    }
    return dates
}

let cache: Recipe[] | null = null

export function loadRecipes({ fresh = false } = {}): Recipe[] {
    if (cache && !fresh) return cache

    const files = fs.readdirSync(recipesDir).filter((f) => f.endsWith('.md')).sort()
    const dates = gitDates(files.map((f) => `docs/recipes/${f}`))

    cache = files.map((file) => {
        const fullPath = path.join(recipesDir, file)
        const { data } = matter(fs.readFileSync(fullPath, 'utf8'))
        const slug = file.replace(/\.md$/, '')
        const mtime = fs.statSync(fullPath).mtimeMs
        const git = dates.get(`docs/recipes/${file}`)
        const categories = splitList(data.categories)

        return {
            slug,
            url: `/recipes/${slug}`,
            name: String(data.name || slug),
            categories: categories.length ? categories : ['Sonstige'],
            tags: splitList(data.tags).map((t) => t.toLowerCase()),
            preview: data.preview ? String(data.preview).trim() : null,
            added: git?.added ?? mtime,
            updated: git?.updated || git?.added || mtime,
        }
    })
    return cache
}

export function sortCategories(categories: Iterable<string>): string[] {
    const rank = (c: string) => {
        const i = CATEGORY_ORDER.indexOf(c)
        return i < 0 ? CATEGORY_ORDER.length : i
    }
    return [...new Set(categories)].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b, 'de'))
}

export function allCategories(recipes = loadRecipes()): string[] {
    return sortCategories(recipes.flatMap((r) => r.categories))
}

export function allTags(recipes = loadRecipes()): string[] {
    return [...new Set(recipes.flatMap((r) => r.tags))].sort((a, b) => a.localeCompare(b, 'de'))
}
