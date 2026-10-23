/**
 * Indexes each page as a single search entry (instead of one per heading), so a
 * recipe shows up once in the results and links to the page, not to "#zutaten".
 * Build-time only: VitePress strips `_`-prefixed search options from the client.
 */
export function splitIntoPage(_file: string, html: string) {
    const stripTags = (s: string) => s.replace(/<[^>]*>/g, '')
    // The h1 is "Title<a class="header-anchor" ...>​</a>"; drop the anchor before stripping tags.
    const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
    const title = h1 ? stripTags(h1[1].replace(/<a[^>]*class="header-anchor"[\s\S]*?<\/a>/i, '')).trim() : ''
    const text = stripTags(h1 ? html.replace(h1[0], ' ') : html).replace(/\s+/g, ' ').trim()
    return title || text ? [{ anchor: '', titles: title ? [title] : [], text }] : []
}

/**
 * MiniSearch term processor, applied to the indexed text (at build time) and
 * to the search query (in the browser).
 *
 * VitePress ships this function to the client via `fn.toString()`, so it must
 * stay fully self-contained: no imports and no references to outer variables.
 */
export function processTerm(term: string): string | null {
    // Generic German stopwords plus recipe vocabulary that appears in nearly
    // every recipe ("Zutaten", "Stufe", ...). Written in normalized form
    // (lowercase, ä→ae, ö→oe, ü→ue, ß→ss). Ingredients are deliberately NOT
    // listed here, so "Zucker" or "Butter" stay searchable.
    const STOPWORDS = new Set([
        'aber', 'alle', 'allem', 'allen', 'aller', 'alles', 'als', 'also', 'am', 'an', 'ander', 'andere', 'anderen',
        'auch', 'auf', 'aus', 'bei', 'beim', 'bis', 'bevor', 'bin', 'bist', 'da', 'dabei', 'dadurch', 'dafuer', 'damit',
        'dann', 'darauf', 'darin', 'darueber', 'das', 'dass', 'dazu', 'dem', 'den', 'denn', 'der', 'des', 'dich', 'die',
        'dies', 'diese', 'diesem', 'diesen', 'dieser', 'dieses', 'dir', 'doch', 'dort', 'du', 'durch', 'ein', 'eine',
        'einem', 'einen', 'einer', 'eines', 'er', 'es', 'etwas', 'euch', 'fuer', 'gegen', 'hat', 'hatte', 'ich', 'ihm',
        'ihn', 'ihr', 'im', 'in', 'ins', 'ist', 'ja', 'je', 'jede', 'jedem', 'jeden', 'jeder', 'jedes', 'kann', 'kein',
        'keine', 'man', 'mehr', 'mit', 'muss', 'nach', 'nicht', 'noch', 'nun', 'nur', 'ob', 'oder', 'ohne', 'sehr',
        'sein', 'sich', 'sie', 'sind', 'so', 'solange', 'sowie', 'um', 'und', 'uns', 'unter', 'viel', 'vom', 'von',
        'vor', 'wenn', 'werden', 'wie', 'wieder', 'wird', 'wir', 'wo', 'zu', 'zum', 'zur', 'zwischen',
        // recipe vocabulary (from the previous search index)
        'zutaten', 'anweisungen', 'zubereitung', 'ingredients', 'instructions', 'gramm', 'kilo', 'zugeben',
        'hinzugeben', 'minuten', 'min', 'sek', 'geben', 'anschliessend', 'danach', 'alternative', 'dazugeben',
        'vorsichtig', 'bedarf', 'serviervorschlag', 'zwischenzeit', 'linkslauf', 'stufe', 'etwa', 'ca', 'circa',
        'optional', 'jeweils', 'beides', 'weiteren', 'weiteres', 'zubereitungszeit', 'verwenden', 'benoetigt',
        'benoetigen', 'benoetigst', 'fuegen', 'hinzugefuegt', 'moeglichst', 'kcal', 'kalorien', 'zwei', 'drei',
        'vier', 'fuenf', 'zehn', 'el', 'tl', 'g', 'kg', 'ml', 'l', 'msp', 'stk', 'stueck',
    ]);

    // Ingredient names that the stemmer would mangle.
    const STEMMING_EXCEPTIONS = new Set(['chicoree']);

    function stem(word: string): string {
        // Plurals like Zwiebeln/Kartoffeln/Nudeln → singular
        if (word.endsWith('eln')) return word.slice(0, -1);
        for (const suffix of ['ern', 'er', 'em', 'en', 'es', 'e']) {
            if (word.endsWith(suffix)) {
                word = word.slice(0, -suffix.length);
                break;
            }
        }
        for (const suffix of ['nd', 'ig', 'isch', 'lich', 'heit', 'keit', 'ung']) {
            if (word.endsWith(suffix)) {
                word = word.slice(0, -suffix.length);
                break;
            }
        }
        if (word.endsWith('keit')) {
            word = word.slice(0, -4);
            if (word.endsWith('ig') || word.endsWith('lich')) word = word.slice(0, -2);
        } else if (word.endsWith('lich') || word.endsWith('heit')) {
            word = word.slice(0, -4);
        } else if (word.endsWith('ung')) {
            word = word.slice(0, -3);
        }
        return word;
    }

    const normalized = term
        .toLowerCase()
        .replace(/ß/g, 'ss')
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '');

    if (normalized.length < 2 || /^\d/.test(normalized) || STOPWORDS.has(normalized)) return null;
    if (STEMMING_EXCEPTIONS.has(normalized)) return normalized;

    // Never stem a word down to nothing useful ("Ei" → "", "Tee" → "t").
    const stemmed = stem(normalized);
    return stemmed.length >= 3 ? stemmed : normalized;
}
