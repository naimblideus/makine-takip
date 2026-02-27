import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const { handlers, signIn, signOut, auth } = NextAuth({
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
                }
            },
        }),
    ],
    session: {
        strategy: 'jwt',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role
                token.tenantId = (user as any).tenantId
                token.tenantName = (user as any).tenantName
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub!
                    ; (session.user as any).role = token.role
                    ; (session.user as any).tenantId = token.tenantId
                    ; (session.user as any).tenantName = token.tenantName
            }
            return session
        },
    },
    pages: {
        signIn: '/login',
    },
})

/**
 * Oturum kontrolü yapan yardımcı fonksiyon
 * Her API route'da kullanılır
 */
export async function getSession() {
    const session = await auth()
    if (!session?.user) {
        return null
    }
    return session
}

/**
 * Tenant ID'sini oturumdan alır
 */
export async function getTenantId(): Promise<string | null> {
    const session = await getSession()
    if (!session) return null
    return (session.user as any).tenantId
}
