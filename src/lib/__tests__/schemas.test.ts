import { describe, it, expect } from 'vitest'
import { randomUUID } from 'crypto'
import { parseBody, FaturaCreateSchema, SignupSchema } from '../schemas'

describe('parseBody + Zod şemaları', () => {
    it('geçerli fatura kabul edilir', () => {
        const r = parseBody(FaturaCreateSchema, { customerId: randomUUID(), issueDate: '2026-01-01', dueDate: '2026-02-01', subtotal: '1000', taxRate: '20' })
        expect(r.ok).toBe(true)
    })
    it('eksik customerId reddedilir', () => {
        const r = parseBody(FaturaCreateSchema, { subtotal: '100', issueDate: 'x', dueDate: 'y' })
        expect(r.ok).toBe(false)
    })
    it('negatif subtotal reddedilir', () => {
        const r = parseBody(FaturaCreateSchema, { customerId: randomUUID(), issueDate: 'x', dueDate: 'y', subtotal: '-5' })
        expect(r.ok).toBe(false)
    })
    it('signup zayıf şifreyi reddeder', () => {
        const r = parseBody(SignupSchema, { companyName: 'A', name: 'B', email: 'a@b.com', password: '123' })
        expect(r.ok).toBe(false)
    })
})
