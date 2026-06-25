import type { Metadata } from 'next'
import './globals.css'
import Providers from '@/components/Providers'

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://makinetakip.app'

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: 'Makine Takip - İş Makinesi Kiralama Yönetim Sistemi',
    template: '%s · Makine Takip',
  },
  description: 'İş makinesi kiralama firmalarına özel, modern ve kullanımı kolay filo yönetim yazılımı.',
  keywords: [
    'iş makinesi kiralama',
    'hakediş',
    'GPS filo',
    'iş makinesi takip',
    'filo yönetimi',
    'ekskavatör kiralama yazılımı',
    'kiralama yönetim sistemi',
  ],
  openGraph: {
    title: 'Makine Takip - İş Makinesi Kiralama Yönetim Sistemi',
    description: 'İş makinesi kiralama firmalarına özel, modern ve kullanımı kolay filo yönetim yazılımı.',
    type: 'website',
    locale: 'tr_TR',
    siteName: 'Makine Takip',
    url: appUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Makine Takip - İş Makinesi Kiralama Yönetim Sistemi',
    description: 'İş makinesi kiralama firmalarına özel, modern ve kullanımı kolay filo yönetim yazılımı.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Makine Takip" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})})}`,
          }}
        />
      </body>
    </html>
  )
}
