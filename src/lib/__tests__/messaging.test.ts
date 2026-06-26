import { describe, it, expect } from 'vitest'
import { normalizePhoneTR } from '../messaging'

describe('normalizePhoneTR — TR telefon normalizasyonu', () => {
    it('çeşitli formatları 90XXXXXXXXXX yapar', () => {
        expect(normalizePhoneTR('0555 123 45 67')).toBe('905551234567')
        expect(normalizePhoneTR('5551234567')).toBe('905551234567')
        expect(normalizePhoneTR('+90 555 123 45 67')).toBe('905551234567')
        expect(normalizePhoneTR('905551234567')).toBe('905551234567')
    })
    it('boş girdi boş döner', () => {
        expect(normalizePhoneTR('')).toBe('')
        expect(normalizePhoneTR('abc')).toBe('')
    })
})
