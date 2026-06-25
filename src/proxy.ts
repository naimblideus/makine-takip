import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'

const { auth } = NextAuth(authConfig)

export default auth

export const config = {
    matcher: [
        '/((?!api/auth|api/setup|api/health|api/cron|api/portal|api/signup|api/teklif-portal|api/m/|api/pazar|api/odeme/|api/talep/|api/emanet/|portal|signup|teklif/|kvkk|fiyatlar|login|m/|pazar|odeme/|talep/|talep-ver|emanet/|robots.txt|sitemap.xml|manifest.json|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.ico$).*)',
    ],
}
