import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// POST /api/setup — İlk super admin oluşturma (hiç yokken)
export async function POST(req: Request) {
    try {
        // system-admin tenant var mı?
        const existing = await prisma.user.findFirst({
            where: { tenantId: 'system-admin' },
        })

        if (existing) {
            return NextResponse.json(
                { error: 'Süper admin zaten mevcut' },
                { status: 409 }
            )
        }

        const body = await req.json()
        const { email, password, name } = body

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email ve şifre zorunlu' },
                { status: 400 }
            )
        }

        const passwordHash = await bcrypt.hash(password, 10)

        // system-admin tenant oluştur
        await prisma.tenant.upsert({
            where: { id: 'system-admin' },
            update: {},
            create: {
                id: 'system-admin',
                name: 'Sistem Yönetimi',
                email: email,
            },
        })

        // Super admin kullanıcı oluştur
        await prisma.user.create({
            data: {
                tenantId: 'system-admin',
                email,
                password: passwordHash,
                name: name || 'Süper Admin',
                role: 'ADMIN',
            },
        })

        return NextResponse.json(
            { success: true, message: 'Süper admin oluşturuldu', email },
            { status: 201 }
        )
    } catch (error: any) {
        return NextResponse.json(
            { error: 'Setup hatası', detail: error.message },
            { status: 500 }
        )
    }
}
