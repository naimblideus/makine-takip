import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'

export const { auth: proxy } = NextAuth(authConfig)

export const config = {
    matcher: [
        '/((?!api/auth|api/setup|login|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.ico$).*)',
    ],
}
