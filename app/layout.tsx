import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Construction Daily Report',
  description: 'Nhật ký thi công hàng ngày - Daily construction progress tracking',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  )
}
