<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useData, withBase } from 'vitepress'
import { data as recipes } from '../../recipes.data'
import { rememberRecipe } from './recent'
import { slugify } from './util'

const { page } = useData()

const recipe = computed(() => {
    const slug = page.value.relativePath.match(/^recipes\/(.+)\.md$/)?.[1]
    return recipes.find((r) => r.slug === slug)
})

// Photos are only cached once viewed; offline, hide a photo that can't load.
const photoFailed = ref(false)
watch(recipe, () => (photoFailed.value = false))

// A load error before hydration never reaches the @error handler.
const photo = ref<HTMLImageElement>()
onMounted(() => {
    if (photo.value?.complete && photo.value.naturalWidth === 0) photoFailed.value = true
})

// Feed the "Zuletzt angesehen" list (client-side only, hence onMounted + watch).
onMounted(() => {
    if (recipe.value) rememberRecipe(recipe.value.slug)
    watch(recipe, (r) => r && rememberRecipe(r.slug))
})
</script>

<template>
    <div v-if="recipe" class="recipe-header">
        <img
            v-if="recipe.preview && !photoFailed"
            ref="photo"
            :src="withBase(recipe.preview)"
            :alt="recipe.name"
            class="photo"
            @error="photoFailed = true"
        />
        <div class="badges">
            <a v-for="c in recipe.categories" :key="c" :href="withBase(`/kategorie/${slugify(c)}`)" class="badge category">{{ c }}</a>
            <a v-for="t in recipe.tags" :key="t" :href="withBase(`/tag/${slugify(t)}`)" class="badge">#{{ t }}</a>
        </div>
    </div>
</template>

<style scoped>
.recipe-header {
    margin-bottom: 8px;
}

.photo {
    width: 100%;
    max-height: 320px;
    object-fit: cover;
    border-radius: 12px;
    margin-bottom: 12px;
}

.badges {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.badge {
    padding: 2px 10px;
    border-radius: 999px;
    font-size: 13px;
    background: var(--vp-c-default-soft);
    color: var(--vp-c-text-1);
    text-decoration: none;
}

.badge.category {
    background: var(--vp-c-brand-soft);
    color: var(--vp-c-brand-1);
    font-weight: 500;
}

@media (max-width: 640px) {
    /* Keep the ingredients close to the top on phones */
    .photo {
        max-height: 180px;
    }
}
</style>
