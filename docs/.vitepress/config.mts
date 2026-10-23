import { defineConfig, type DefaultTheme } from 'vitepress'
import { withPwa } from '@vite-pwa/vitepress'
import { processTerm, splitIntoPage } from './search'
import { allCategories, loadRecipes, slugify } from './recipes'

const base = '/family-recipes/'
const title = 'Familienrezepte'
const themeColor = '#fe640b'

// Categories only: listing every recipe here would be rendered into each page's HTML
// (~100 KB per page) and bloat the offline cache. Category pages show the recipes.
function sidebar(): DefaultTheme.SidebarItem[] {
    const recipes = loadRecipes()
    return [
        {
            text: 'Kategorien',
            items: allCategories(recipes).map((category) => ({
                text: `${category} (${recipes.filter((r) => r.categories.includes(category)).length})`,
                link: `/kategorie/${slugify(category)}`,
            })),
        },
        {
            text: 'Übersicht',
            items: [
                { text: 'Neu hinzugefügt', link: '/' },
                { text: 'Alle Rezepte A–Z', link: '/alle' },
                { text: 'Tags', link: '/tags' },
            ],
        },
    ]
}

export default withPwa(defineConfig({
    base,
    lang: 'de-DE',
    title,
    description: 'Unsere Familienrezepte – durchsuchbar und offline verfügbar.',
    cleanUrls: true,
    // Keep the page hash map out of every HTML file (smaller offline cache)
    metaChunk: true,
    lastUpdated: true,

    head: [
        ['link', { rel: 'icon', href: `${base}favicon.svg`, type: 'image/svg+xml' }],
        ['link', { rel: 'apple-touch-icon', href: `${base}apple-touch-icon.png` }],
        ['meta', { name: 'theme-color', content: themeColor }],
    ],

    // Recipes carry their name in frontmatter; dates come from git (see recipes.ts),
    // which skips line-ending fixes and pure renames.
    transformPageData(pageData) {
        const slug = pageData.relativePath.match(/^recipes\/(.+)\.md$/)?.[1]
        if (!slug) return
        const recipe = loadRecipes().find((r) => r.slug === slug)
        if (!recipe) return
        pageData.title = recipe.name
        pageData.lastUpdated = recipe.updated
    },

    themeConfig: {
        logo: '/favicon.svg',
        nav: [
            { text: 'Kategorien', link: '/kategorien' },
            { text: 'Tags', link: '/tags' },
            { text: 'A–Z', link: '/alle' },
        ],
        sidebar: sidebar(),
        socialLinks: [{ icon: 'github', link: 'https://github.com/yvo-niedrich/family-recipes' }],
        editLink: {
            pattern: 'https://github.com/yvo-niedrich/family-recipes/edit/main/docs/:path',
            text: 'Rezept auf GitHub bearbeiten',
        },

        search: {
            provider: 'local',
            options: {
                miniSearch: {
                    _splitIntoSections: splitIntoPage,
                    options: { processTerm },
                    searchOptions: { combineWith: 'AND', fuzzy: 0.2, prefix: true, boost: { title: 4, text: 2, titles: 1 } },
                },
                translations: {
                    button: { buttonText: 'Rezepte suchen', buttonAriaLabel: 'Rezepte durchsuchen' },
                    modal: {
                        displayDetails: 'Details anzeigen',
                        resetButtonTitle: 'Suche zurücksetzen',
                        backButtonTitle: 'Suche schließen',
                        noResultsText: 'Keine Rezepte gefunden für',
                        footer: { selectText: 'öffnen', navigateText: 'navigieren', closeText: 'schließen' },
                    },
                },
            },
        },

        outline: { level: 2, label: 'Auf dieser Seite' },
        docFooter: { prev: false, next: false },
        lastUpdated: {
            text: 'Zuletzt geändert',
            formatOptions: { dateStyle: 'medium', forceLocale: true },
        },
        darkModeSwitchLabel: 'Erscheinungsbild',
        lightModeSwitchTitle: 'Helles Design',
        darkModeSwitchTitle: 'Dunkles Design',
        sidebarMenuLabel: 'Menü',
        returnToTopLabel: 'Nach oben',
        langMenuLabel: 'Sprache',
        notFound: {
            title: 'Seite nicht gefunden',
            quote: 'Dieses Rezept gibt es (noch) nicht.',
            linkLabel: 'Zur Startseite',
            linkText: 'Zur Startseite',
        },
    },

    pwa: {
        registerType: 'autoUpdate',
        injectRegister: 'script-defer',
        includeAssets: ['favicon.svg', 'placeholder/*.jpg'],
        manifest: {
            name: title,
            short_name: 'Rezepte',
            description: 'Unsere Familienrezepte – auch offline.',
            lang: 'de',
            theme_color: themeColor,
            background_color: '#ffffff',
            display: 'standalone',
            icons: [
                { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
                { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
                { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
            ],
        },
        workbox: {
            // Every page and the search index are precached, so recipes are always readable
            // offline. Recipe photos are cached the first time they're viewed.
            globPatterns: ['**/*.{html,css,js,svg,png,ico,woff2}', 'placeholder/*.jpg'],
            globIgnores: ['images/**'],
            runtimeCaching: [
                {
                    urlPattern: ({ url }) => url.pathname.includes('/images/'),
                    handler: 'CacheFirst',
                    options: {
                        cacheName: 'recipe-images',
                        expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 365 },
                        cacheableResponse: { statuses: [0, 200] },
                    },
                },
            ],
        },
    },
}))
