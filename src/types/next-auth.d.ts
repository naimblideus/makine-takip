import 'next-auth'

declare module 'next-auth' {
    interface Session {
        user: {
            id: string
            name: string
            email: string
            role: 'ADMIN' | 'PERSONEL' | 'MUHASEBE'
            tenantId: string
            tenantName: string
        }
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        role: 'ADMIN' | 'PERSONEL' | 'MUHASEBE'
        tenantId: string
        tenantName: string
    }
}
