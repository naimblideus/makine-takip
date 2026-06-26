import { describe, it, expect } from 'vitest'
import { PACKAGES, yearlyMonthly, YEARLY_DISCOUNT } from '../pricing'

describe('pricing — paketleme', () => {
    it('3 paket, doğru sıra ve fiyatlar', () => {
        expect(PACKAGES.map(p => p.key)).toEqual(['TEMEL', 'PRO', 'PLATFORM'])
        expect(PACKAGES.map(p => p.pricePerMachine)).toEqual([1000, 2000, 3000])
    })
    it('PRO önerilen (anchor) paket', () => {
        expect(PACKAGES.find(p => p.key === 'PRO')?.recommended).toBe(true)
    })
    it('yıllık %15 indirim', () => {
        expect(YEARLY_DISCOUNT).toBe(0.15)
        expect(yearlyMonthly(2000)).toBe(1700)
        expect(yearlyMonthly(1000)).toBe(850)
    })
})
