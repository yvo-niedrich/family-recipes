<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import { data as recipes } from '../../recipes.data'
import { slugify } from './util'

// Most-used categories first
const categories = computed(() => {
    const counts = new Map<string, number>()
    for (const r of recipes) for (const c of r.categories) counts.set(c, (counts.get(c) ?? 0) + 1)
    return [...counts].sort((a, b) => b[1] - a[1])
})
</script>

<template>
    <div class="chips">
        <a v-for="[name, count] in categories" :key="name" :href="withBase(`/kategorie/${slugify(name)}`)" class="chip">
            {{ name }} <span class="count">{{ count }}</span>
        </a>
    </div>
</template>

<style scoped>
.chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 16px 0;
}

.chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 999px;
    border: 1px solid var(--vp-c-divider);
    background: var(--vp-c-bg-soft);
    color: var(--vp-c-text-1) !important;
    text-decoration: none !important;
    font-weight: 500;
}

.chip:hover {
    border-color: var(--vp-c-brand-1);
    color: var(--vp-c-brand-1) !important;
}

.count {
    font-size: 12px;
    color: var(--vp-c-text-2);
}
</style>
