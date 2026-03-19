import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { authConfig } from './auth.config'

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            name: 'Credentials',
            credentials: {
                email: { label: 'E-posta', type: 'email' },
                password: { label: 'Şifre', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('E-posta ve şifre gereklidir')
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string },
                    include: { tenant: true },
                })

                if (!user || !user.isActive) {
                    throw new Error('Geçersiz e-posta veya şifre')
                }

                const isValid = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                )

                if (!isValid) {
                    throw new Error('Geçersiz e-posta veya şifre')
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    tenantId: user.tenantId,
                    tenantName: user.tenant.name,
                    isSuperAdmin: user.tenantId === 'system-admin',
                }
            },
        }),
    ],
})

export async function getSession() {
    const session = await auth()
    if (!session?.user) return null
    return session
}

export async function getTenantId(): Promise<string | null> {
    const session = await getSession()
    if (!session) return null
    return (session.user as any).tenantId
}

export async function requireSuperAdmin() {
    const session = await getSession()
    if (!session) return null
    const tenantId = (session.user as any).tenantId
    if (tenantId !== 'system-admin') return null
    return session
}
