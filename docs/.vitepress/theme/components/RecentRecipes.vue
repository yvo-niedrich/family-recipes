<script setup lang="ts">
// Rendered client-side only: the list lives in localStorage, and nothing shows until it has an entry.
import { computed, onMounted, ref } from 'vue'
import { data as recipes } from '../../recipes.data'
import RecipeGrid from './RecipeGrid.vue'
import { readRecent } from './recent'

const props = withDefaults(defineProps<{ limit?: number }>(), { limit: 6 })

const recent = ref<string[]>([])
onMounted(() => (recent.value = readRecent()))

// Skip recipes that were renamed or removed since they were viewed.
const slugs = computed(() =>
    recent.value.filter((slug) => recipes.some((r) => r.slug === slug)).slice(0, props.limit))
</script>

<template>
    <section v-if="slugs.length" class="recent-recipes">
        <h2>Zuletzt angesehen</h2>
        <RecipeGrid :slugs="slugs" :limit="props.limit" />
    </section>
</template>
