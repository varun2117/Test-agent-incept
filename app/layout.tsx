import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import AuthWrapper from '@/components/AuthWrapper'
import Header from '@/components/Header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Test Chat Agents - Red Team Testing Platform',
  description: 'Collection of diverse chat agents for security testing and red team assessments',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthWrapper>
          <Header />
          {children}
        </AuthWrapper>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}