import type { Metadata } from 'next'
import { Inter, Fredoka, Nunito } from 'next/font/google'

import { Providers } from '@/components/providers'
import { ThemeProvider } from '@/components/ThemeProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })
const fredokaOne = Fredoka({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-fredoka-one'
})
const nunito = Nunito({ 
  subsets: ['latin'],
  variable: '--font-nunito'
})

export const metadata: Metadata = {
  title: 'Chain Crush',
  description: 'A fun Game on base',
  icons: {
    icon: [
      { url: '/images/icon.jpg', sizes: '32x32', type: 'image/png' },
      { url: '/images/icon.jpg', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/images/icon.jpg',
    apple: '/images/icon.jpg',
  },
  other: {
    'msapplication-TileImage': '/images/icon.jpg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${fredokaOne.variable} ${nunito.variable}`}>
        <ThemeProvider>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
