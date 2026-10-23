import { loadRecipes, type Recipe } from './recipes'

export type { Recipe }
declare const data: Recipe[]
export { data }

export default {
    watch: ['../recipes/*.md'],
    load: () => loadRecipes({ fresh: true }),
}
