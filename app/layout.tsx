import type { Metadata } from 'next'
import './globals.css'
import { LectureProvider } from '@/contexts/lecture-context'
import { AuthProvider } from '@/contexts/auth-context'

export const metadata: Metadata = {
  title: 'EduFlow — 실시간 강의 관리 플랫폼',
  description: 'AI 기반 챕터 자동 생성, 실시간 Q&A, 강의 후 리포트',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          <LectureProvider>
            {children}
          </LectureProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
