# Familienrezepte

Our family recipes as a searchable, offline-capable website, built with [VitePress](https://vitepress.dev).

**→ https://yvo-niedrich.github.io/family-recipes/**

- Full-text search (German-aware), works offline
- Installable as an app (PWA) — recipes stay available without internet, e.g. while shopping
- Recipes are plain Markdown in [`docs/recipes/`](docs/recipes)

## Development

```sh
npm install
npm run dev     # local dev server
npm test        # check recipes + search
npm run build   # production build
```

See [CLAUDE.md](CLAUDE.md) for how to add a recipe and how the site works.
