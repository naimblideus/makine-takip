// POST /api/signup — Self-serve kayıt: yeni Tenant (14 gün ücretsiz deneme) + admin kullanıcı
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { rateLimited } from '@/lib/api-guard'
import { SignupSchema, parseBody } from '@/lib/schemas'

export async function POST(req: NextRequest) {
    try {
        const limited = rateLimited(req, 'signup', 5, 60_000)
        if (limited) return limited
        const parsed = parseBody(SignupSchema, await req.json())
        if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })
        const { companyName, name, email, password, phone } = parsed.data

        const existing = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } })
        if (existing) {
            return NextResponse.json({ error: 'Bu e-posta ile zaten bir hesap var' }, { status: 409 })
        }

        const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        const hashed = await bcrypt.hash(String(password), 10)

        const tenant = await prisma.tenant.create({
            data: {
                name: companyName,
                phone: phone || null,
                email: String(email).toLowerCase(),
                plan: 'TEMEL',
                subscriptionStatus: 'TRIAL',
                trialEndsAt,
                machineLimit: 15,
                users: {
                    create: {
                        email: String(email).toLowerCase(),
                        password: hashed,
                        name,
                        role: 'ADMIN',
                    },
                },
            },
        })

        return NextResponse.json({ success: true, tenantId: tenant.id, trialEndsAt }, { status: 201 })
    } catch (e: any) {
        console.error('Signup hatası:', e)
        return NextResponse.json({ error: 'Kayıt sırasında hata oluştu' }, { status: 500 })
    }
}
