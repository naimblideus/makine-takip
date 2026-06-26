import { describe, it, expect } from 'vitest'
import { toMoney, sumMoney, taxOf } from '../calc'

describe('calc — para aritmetiği (kuruş güvenli)', () => {
    it('toMoney 2 ondalığa yuvarlar', () => {
        expect(toMoney(1999.999)).toBe(2000)
        expect(toMoney(0.1 + 0.2)).toBe(0.3)
        expect(toMoney(1999.99 * 7)).toBe(13999.93)
    })
    it('toMoney geçersiz girdide 0 döner', () => {
        expect(toMoney(NaN)).toBe(0)
        expect(toMoney(Infinity)).toBe(0)
    })
    it('sumMoney null/undefined atlar', () => {
        expect(sumMoney(0.1, 0.2, 0.3)).toBe(0.6)
        expect(sumMoney(100, null, undefined, 50)).toBe(150)
    })
    it('taxOf KDV doğru hesaplar', () => {
        expect(taxOf(1000, 20)).toBe(200)
        expect(taxOf(1999.99, 20)).toBe(400) // 399.998 → 400.00
    })
})
