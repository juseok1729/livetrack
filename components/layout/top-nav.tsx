'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GraduationCap, PlusCircle, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useLecture } from '@/contexts/lecture-context'
import type { Lecture } from '@/lib/types'

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export function TopNav() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { dispatch } = useLecture()

  function createLecture() {
    const code = generateCode()
    const id = `lec-${Date.now()}`
    const newLecture: Lecture = {
      id, title: '새 강의', code, status: 'preparing',
      totalSlides: 1, chapters: [], studentCount: 0,
      createdAt: new Date().toISOString(),
    }
    dispatch({ type: 'ADD_LECTURE', lecture: newLecture })
    router.push(`/lecturer/prepare/${id}`)
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-[#0a0a0a] border-b border-[#2a2a2a] flex items-center px-6 z-40">
      <Link href="/" className="flex items-center gap-2.5 mr-auto">
        <div className="w-7 h-7 rounded-lg bg-[#865FDF] flex items-center justify-center flex-shrink-0">
          <GraduationCap size={14} className="text-white" />
        </div>
        <span className="text-white font-semibold text-sm tracking-tight">LiveTrack</span>
      </Link>

      <div className="flex items-center gap-3">
        <button
          onClick={createLecture}
          className="flex items-center gap-1.5 bg-[#865FDF] hover:bg-[#7450cc] text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors"
        >
          <PlusCircle size={14} />
          새 강의 만들기
        </button>

        {user && (
          <>
            <div className="flex items-center gap-2 pl-2 border-l border-[#2a2a2a]">
              <div className="w-7 h-7 rounded-full bg-[#865FDF] flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-semibold">{user.name[0]}</span>
              </div>
              <span className="text-sm text-[#a0a0a0]">{user.name}</span>
            </div>
            <button
              onClick={async () => { await logout(); router.push('/') }}
              className="flex items-center gap-1 text-xs text-[#555555] hover:text-[#ef4444] px-2 py-1.5 rounded-lg hover:bg-red-900/20 transition-colors"
            >
              <LogOut size={13} /> 로그아웃
            </button>
          </>
        )}
      </div>
    </header>
  )
}
