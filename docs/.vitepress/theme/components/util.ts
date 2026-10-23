import { withBase } from 'vitepress'
import type { Recipe } from '../../recipes.data'

/** Same rules as slugify() in recipes.ts, which builds the category/tag URLs. */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/ß/g, 'ss').replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
        .normalize('NFKD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
}

export function placeholderUrl(index: number): string {
    return withBase(`/placeholder/placeholder${(index % 4) + 1}.jpg`)
}

export function previewUrl(recipe: Recipe, index: number): string {
    return recipe.preview ? withBase(recipe.preview) : placeholderUrl(index)
}
