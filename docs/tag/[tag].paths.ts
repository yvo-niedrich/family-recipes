import { allTags, slugify } from '../.vitepress/recipes'

export default {
    paths: () => allTags().map((name) => ({
        params: { tag: slugify(name), name },
        content: `# #${name}`,
    })),
}
