<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { withBase } from 'vitepress'
import { data as recipes } from '../../recipes.data'
import { placeholderUrl, previewUrl } from './util'

const props = withDefaults(defineProps<{
    category?: string
    tag?: string
    /** Show exactly these recipes, in this order (ignores sort). */
    slugs?: string[]
    sort?: 'name' | 'added'
    limit?: number
}>(), { sort: 'name' })

const items = computed(() => {
    const list = recipes
        .map((recipe, index) => ({ recipe, index }))
        .filter(({ recipe }) => !props.category || recipe.categories.includes(props.category))
        .filter(({ recipe }) => !props.tag || recipe.tags.includes(props.tag))
        .filter(({ recipe }) => !props.slugs || props.slugs.includes(recipe.slug))
        .sort((a, b) => props.slugs
            ? props.slugs.indexOf(a.recipe.slug) - props.slugs.indexOf(b.recipe.slug)
            : props.sort === 'added'
                ? b.recipe.added - a.recipe.added
                : a.recipe.name.localeCompare(b.recipe.name, 'de'))
    return props.limit ? list.slice(0, props.limit) : list
})

// Photos are only cached once viewed; offline, show the placeholder instead of a broken image.
function usePlaceholder(img: HTMLImageElement, index: number) {
    const fallback = placeholderUrl(index)
    if (!img.src.endsWith(fallback)) img.src = fallback
}

// Images that failed before hydration never reach the @error handler.
const grid = ref<HTMLElement>()
onMounted(() => {
    grid.value?.querySelectorAll('img').forEach((img, i) => {
        if (img.complete && img.naturalWidth === 0) usePlaceholder(img, items.value[i].index)
    })
})
</script>

<template>
    <p v-if="!props.limit" class="count">{{ items.length }} Rezepte</p>
    <ul ref="grid" class="recipe-grid">
        <li v-for="{ recipe, index } in items" :key="recipe.slug">
            <a :href="withBase(recipe.url)" class="card">
                <img
                    :src="previewUrl(recipe, index)"
                    :class="{ placeholder: !recipe.preview }"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    @error="usePlaceholder($event.target as HTMLImageElement, index)"
                />
                <span class="name">{{ recipe.name }}</span>
                <span class="meta">{{ recipe.categories.join(' · ') }}</span>
            </a>
        </li>
    </ul>
</template>

<style scoped>
.count {
    color: var(--vp-c-text-2);
    font-size: 14px;
}

.recipe-grid {
    list-style: none;
    padding: 0 !important;
    margin: 16px 0;
    display: grid;
    gap: 16px;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 200px), 1fr));
}

.recipe-grid li {
    margin: 0 !important;
}

.card {
    display: flex;
    flex-direction: column;
    height: 100%;
    border: 1px solid var(--vp-c-divider);
    border-radius: 12px;
    overflow: hidden;
    background: var(--vp-c-bg-soft);
    color: inherit !important;
    text-decoration: none !important;
    transition: border-color .2s, transform .2s;
}

.card:hover {
    border-color: var(--vp-c-brand-1);
    transform: translateY(-2px);
}

.card img {
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
    background: var(--vp-c-bg-alt);
}

.card img.placeholder {
    opacity: .75;
}

.name {
    padding: 10px 12px 2px;
    font-weight: 600;
    line-height: 1.35;
}

.meta {
    padding: 0 12px 12px;
    font-size: 13px;
    color: var(--vp-c-text-2);
}

@media (max-width: 480px) {
    /* Two compact columns on phones */
    .recipe-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
    }
    .name {
        font-size: 14px;
        padding: 8px 8px 2px;
    }
    .meta {
        font-size: 12px;
        padding: 0 8px 8px;
    }
}
</style>
