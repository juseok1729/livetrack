'use client'

import { useRouter } from 'next/navigation'
import { GraduationCap, Sparkles, BookOpen, MessageSquare, LogIn } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useLecture } from '@/contexts/lecture-context'
import type { Lecture } from '@/lib/types'

const features = [
  { icon: Sparkles,       title: 'AI 챕터 자동 생성' },
  { icon: BookOpen,       title: '실시간 챕터 현황 및 AI 요약' },
  { icon: MessageSquare,  title: 'AI 질문 요약' },
]

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function HomePage() {
  const router = useRouter()
  const { user, logout, login } = useAuth()
  const { dispatch } = useLecture()

  function handleCreateLecture() {
    if (!user) { router.push('/auth/login?redirect=/'); return }
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

  function handleLectureList() {
    if (!user) { router.push('/auth/login?redirect=/lecturer'); return }
    router.push('/lecturer')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1040] via-[#2d1b69] to-[#3d2b8a] text-white flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#865FDF] flex items-center justify-center">
            <GraduationCap size={16} className="text-white" />
          </div>
          <span className="font-semibold text-lg tracking-tight">LiveTrack</span>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="w-8 h-8 rounded-full bg-[#865FDF] flex items-center justify-center cursor-default">
                <span className="text-sm font-semibold text-white">{user.name[0]}</span>
              </div>
              <span className="text-sm text-white/80">{user.name}</span>
              <button
                onClick={logout}
                className="text-xs text-white/60 hover:text-white/90 transition-colors px-2 py-1"
              >
                로그아웃
              </button>
            </>
          ) : (
            <button
              onClick={async () => { await login('admin@livetrack.com', 'kkkkkk') }}
              className="flex items-center gap-1.5 text-sm text-white bg-[#865FDF] hover:bg-[#7450cc] px-4 py-2 rounded-lg transition-colors font-medium"
            >
              <LogIn size={14} />
              로그인
            </button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-8 py-20">
        <h1 className="text-5xl font-bold leading-tight mb-4">
          실시간 강의, 운영은 AI에 맡기고<br />
          수업에만 집중하세요
        </h1>

        <p className="text-white/60 text-base max-w-lg leading-relaxed mb-10">
          자료만 올리면, AI가 강의의 흐름에 맞춰 챕터를 구성하고 실시간 질답을 정리합니다.<br />
          번거로운 운영은 맡기고, 수강생과의 연결에 집중하세요.
        </p>

        <div className="flex items-center gap-4 mb-16">
          <button
            onClick={handleLectureList}
            className="px-7 py-3 rounded-xl border border-white/60 hover:border-white text-white font-semibold transition-colors"
          >
            예정된 강의
          </button>
          <button
            onClick={handleCreateLecture}
            className="px-7 py-3 rounded-xl border border-white/60 hover:border-white text-white font-semibold transition-colors"
          >
            강의 만들기 →
          </button>
        </div>

        {/* Feature cards */}
        <div className="w-full max-w-4xl grid grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title }) => (
            <div key={title} className="bg-white rounded-2xl shadow-lg overflow-hidden" style={{ height: '300px' }}>
              {/* Card header */}
              <div className="flex items-center gap-2 px-5 pt-5 pb-3">
                <Icon size={18} className="text-[#865FDF]" />
                <h3 className="font-semibold text-sm text-gray-800">{title}</h3>
              </div>
              {/* Placeholder mockup area */}
              <div className="mx-4 mb-4 rounded-xl bg-[#f3f3f3]" style={{ height: '200px' }} />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
