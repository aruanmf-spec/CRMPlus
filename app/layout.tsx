import type { Metadata } from 'next'
import './globals.css'
import './workflow.css'

export const metadata: Metadata = {
  title: 'CRM Plus',
  description: 'Apps operacionais independentes, profundos e focados.'
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
