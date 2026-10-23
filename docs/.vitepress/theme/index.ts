import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { h } from 'vue'
import CategoryChips from './components/CategoryChips.vue'
import RecipeGrid from './components/RecipeGrid.vue'
import RecentRecipes from './components/RecentRecipes.vue'
import RecipeHeader from './components/RecipeHeader.vue'
import RecipeTools from './components/RecipeTools.vue'
import TagCloud from './components/TagCloud.vue'
import '@catppuccin/vitepress/theme/macchiato/mauve.css'
import './custom.css'

export default {
    extends: DefaultTheme,
    Layout: () => h(DefaultTheme.Layout, null, {
        'doc-before': () => [h(RecipeHeader), h(RecipeTools)],
    }),
    enhanceApp({ app }) {
        app.component('RecipeGrid', RecipeGrid)
        app.component('CategoryChips', CategoryChips)
        app.component('RecentRecipes', RecentRecipes)
        app.component('TagCloud', TagCloud)
    },
} satisfies Theme
