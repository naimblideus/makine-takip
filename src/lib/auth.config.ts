import type { NextAuthConfig } from 'next-auth'

// Edge-safe config — Prisma veya bcrypt import etmez
export const authConfig: NextAuthConfig = {
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: 'jwt',
        maxAge: 8 * 60 * 60,
    },
    secret: process.env.AUTH_SECRET,
    callbacks: {
        authorized({ auth }) {
            return !!auth?.user
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role
                token.tenantId = (user as any).tenantId
                token.tenantName = (user as any).tenantName
                token.isSuperAdmin = (user as any).isSuperAdmin
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub!
                    ; (session.user as any).role = token.role
                    ; (session.user as any).tenantId = token.tenantId
                    ; (session.user as any).tenantName = token.tenantName
                    ; (session.user as any).isSuperAdmin = token.isSuperAdmin
            }
            return session
        },
    },
    providers: [],
}
