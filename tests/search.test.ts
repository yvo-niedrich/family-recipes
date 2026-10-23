import { describe, expect, test } from 'vitest'
import { processTerm } from '../docs/.vitepress/search'

// VitePress ships processTerm to the browser via toString(); this is what runs there.
const clientProcessTerm = new Function(`return ${processTerm.toString()}`)() as typeof processTerm

describe.each([
    ['build', processTerm],
    ['client', clientProcessTerm],
])('processTerm (%s)', (_, fn) => {
    test('normalizes umlauts and case', () => {
        expect(fn('Süßkartoffel')).toBe(fn('suesskartoffel'))
        expect(fn('Möhre')).toBe(fn('MOEHRE'))
    })

    test('stems plural and inflected forms to the same term', () => {
        expect(fn('Zwiebeln')).toBe(fn('Zwiebel'))
        expect(fn('Linsen')).toBe(fn('Linse'))
        expect(fn('Tomaten')).toBe(fn('Tomate'))
    })

    test('drops stopwords, recipe boilerplate and numbers', () => {
        expect(fn('und')).toBeNull()
        expect(fn('Zutaten')).toBeNull()
        expect(fn('Stufe')).toBeNull()
        expect(fn('250g')).toBeNull()
    })

    test('keeps ingredients searchable', () => {
        for (const word of ['Zucker', 'Butter', 'Mehl', 'Salz', 'Ei', 'Tee']) {
            expect(fn(word)).toBeTruthy()
        }
    })

    test('keeps stemming exceptions intact', () => {
        expect(fn('Chicorée')).toBe('chicoree')
    })
})
