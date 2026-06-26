import { describe, it, expect } from 'vitest'
import { genPayToken, PAYMENT_MOCK } from '../payment'

describe('payment — token + mock', () => {
    it('genPayToken benzersiz 40-haneli hex üretir', () => {
        const a = genPayToken()
        const b = genPayToken()
        expect(a).toMatch(/^[0-9a-f]{40}$/)
        expect(a).not.toBe(b)
    })
    it('anahtar yokken mock modda', () => {
        expect(PAYMENT_MOCK).toBe(true)
    })
})
