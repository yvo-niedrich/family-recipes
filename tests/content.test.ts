import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { describe, expect, test } from 'vitest'

const recipesDir = path.resolve(__dirname, '../docs/recipes')
const publicDir = path.resolve(__dirname, '../docs/public')
const files = fs.readdirSync(recipesDir).filter((f) => f.endsWith('.md'))

describe.each(files)('%s', (file) => {
    const source = fs.readFileSync(path.join(recipesDir, file), 'utf8')

    test('has valid frontmatter with name and categories', () => {
        const { data } = matter(source)
        expect(data.name, 'name').toBeTruthy()
        expect(String(data.categories ?? '').trim(), 'categories').not.toBe('')
    })

    test('uses a lowercase file name', () => {
        expect(file).toMatch(/^[a-z0-9_-]+\.md$/)
    })

    test('notes use GitHub alerts with a German title', () => {
        // Old style "> **Tipp**" renders as a plain quote; see CLAUDE.md for the alert types.
        expect(source).not.toMatch(/^> \*\*[^*]+\*\*:?\s*$/m)
        for (const [, type, title] of source.matchAll(/^> \[!(\w+)\](.*)$/gm)) {
            expect(['TIP', 'NOTE', 'WARNING', 'IMPORTANT', 'INFO'], `alert type ${type}`).toContain(type)
            expect(title.trim(), `title for [!${type}]`).not.toBe('')
        }
    })

    test('preview image exists (case-sensitive, as on GitHub Pages)', () => {
        const preview = matter(source).data.preview
        if (!preview) return
        const dir = path.join(publicDir, path.dirname(preview))
        expect(fs.readdirSync(dir)).toContain(path.basename(preview))
    })
})
