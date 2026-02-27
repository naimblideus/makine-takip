'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { data: session, status } = useSession()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    if (status === 'loading') {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto 1rem' }} />
                    <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Yükleniyor...</p>
                </div>
            </div>
        )
    }

    if (!session) {
        redirect('/login')
    }

    return (
        <div>
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="main-content">
                <Header onMenuClick={() => setSidebarOpen(true)} />
                <main className="main-body animate-fade-in">
                    {children}
                </main>
            </div>
        </div>
    )
}
