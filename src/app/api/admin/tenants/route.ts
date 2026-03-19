import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function GET() {
    const session = await requireSuperAdmin()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

    try {
        const tenants = await prisma.tenant.findMany({
            where: { id: { not: 'system-admin' } },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { users: true, machines: true, rentals: true, customers: true },
                },
                users: {
                    where: { role: 'ADMIN' },
                    select: { id: true, email: true, name: true },
                    take: 1,
                },
            },
        })

        const stats = {
            totalTenants: tenants.length,
            totalUsers: tenants.reduce((s, t) => s + t._count.users, 0),
            totalMachines: tenants.reduce((s, t) => s + t._count.machines, 0),
            totalRentals: tenants.reduce((s, t) => s + t._count.rentals, 0),
        }

        return NextResponse.json({ tenants, stats })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    const session = await requireSuperAdmin()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

    try {
        const body = await req.json()
        const { name, phone, email, address, taxOffice, taxNumber, adminName, adminEmail, adminPassword } = body

        if (!name || !adminEmail || !adminPassword) {
            return NextResponse.json({ error: 'İşletme adı, admin email ve şifre zorunlu' }, { status: 400 })
        }

        const passwordHash = await bcrypt.hash(adminPassword, 10)

        const tenant = await prisma.tenant.create({
            data: {
                name,
                phone: phone || '',
                email: email || '',
                address: address || '',
                taxOffice: taxOffice || null,
                taxNumber: taxNumber || null,
                users: {
                    create: {
                        name: adminName || name + ' Admin',
                        email: adminEmail,
                        password: passwordHash,
                        role: 'ADMIN',
                    },
                },
            },
            include: {
                users: { select: { id: true, name: true, email: true, role: true } },
                _count: { select: { users: true, machines: true } },
            },
        })

        return NextResponse.json({ tenant, message: 'İşletme oluşturuldu' }, { status: 201 })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PUT(req: NextRequest) {
    const session = await requireSuperAdmin()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

    try {
        const body = await req.json()
        const { id, name, phone, email, address, taxOffice, taxNumber, adminEmail, adminPassword } = body

        if (!id) return NextResponse.json({ error: 'ID zorunlu' }, { status: 400 })

        const updateData: any = {}
        if (name) updateData.name = name
        if (phone !== undefined) updateData.phone = phone
        if (email !== undefined) updateData.email = email
        if (address !== undefined) updateData.address = address
        if (taxOffice !== undefined) updateData.taxOffice = taxOffice
        if (taxNumber !== undefined) updateData.taxNumber = taxNumber

        const tenant = await prisma.tenant.update({
            where: { id },
            data: updateData,
        })

        // Admin kullanıcı güncelle
        if (adminEmail || adminPassword) {
            const adminUser = await prisma.user.findFirst({
                where: { tenantId: id, role: 'ADMIN' },
            })
            if (adminUser) {
                const userUpdate: any = {}
                if (adminEmail) userUpdate.email = adminEmail
                if (adminPassword) userUpdate.password = await bcrypt.hash(adminPassword, 10)
                await prisma.user.update({ where: { id: adminUser.id }, data: userUpdate })
            }
        }

        return NextResponse.json({ tenant, message: 'İşletme güncellendi' })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest) {
    const session = await requireSuperAdmin()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID gerekli' }, { status: 400 })
    if (id === 'system-admin') return NextResponse.json({ error: 'Sistem tenant silinemez' }, { status: 400 })

    try {
        await prisma.tenant.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
