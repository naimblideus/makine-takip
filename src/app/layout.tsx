import type { Metadata } from 'next'
import './globals.css'
import Providers from '@/components/Providers'

export const metadata: Metadata = {
  title: 'Makine Takip - İş Makinesi Kiralama Yönetim Sistemi',
  description: 'İş makinesi kiralama firmalarına özel, modern ve kullanımı kolay filo yönetim yazılımı.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
