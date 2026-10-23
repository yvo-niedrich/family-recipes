import { allCategories, slugify } from '../.vitepress/recipes'

export default {
    paths: () => allCategories().map((name) => ({
        params: { category: slugify(name), name },
        content: `# ${name}`,
    })),
}
