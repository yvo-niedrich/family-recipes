<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import { data as recipes } from '../../recipes.data'
import { slugify } from './util'

const tags = computed(() => {
    const counts = new Map<string, number>()
    for (const r of recipes) for (const t of r.tags) counts.set(t, (counts.get(t) ?? 0) + 1)
    return [...counts].sort((a, b) => a[0].localeCompare(b[0], 'de'))
})
</script>

<template>
    <div class="tags">
        <a v-for="[name, count] in tags" :key="name" :href="withBase(`/tag/${slugify(name)}`)" class="tag">
            #{{ name }} <span class="count">{{ count }}</span>
        </a>
    </div>
</template>

<style scoped>
.tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 16px 0;
}

.tag {
    padding: 4px 12px;
    border-radius: 999px;
    background: var(--vp-c-default-soft);
    color: var(--vp-c-text-1) !important;
    text-decoration: none !important;
    font-size: 14px;
}

.tag:hover {
    color: var(--vp-c-brand-1) !important;
}

.count {
    font-size: 12px;
    color: var(--vp-c-text-2);
}
</style>
