'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GraduationCap, Sparkles, BookOpen, MessageSquare, BarChart3, ArrowRight, MonitorPlay, LogIn } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useLecture } from '@/contexts/lecture-context'
import type { Lecture } from '@/lib/types'

const features = [
  { icon: Sparkles,    title: 'AI 챕터 자동 생성', desc: 'PPT/PDF를 업로드하면\nAI가 자동으로 챕터를 제안합니다' },
  { icon: BookOpen,    title: '실시간 챕터 패널',   desc: '수강생이 항상 강의 어디쯤\n있는지 한눈에 볼 수 있습니다' },
  { icon: MessageSquare, title: '중요 질문 유실 방지', desc: '좋아요 기반 질문 정렬로\n중요한 질문을 놓치지 않습니다' },
  { icon: BarChart3,   title: '다음 강의 개선 피드백', desc: '챕터별 진행 시간과\n집중도 변화를 자동으로 정리합니다' },
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
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-[#1e1e1e]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#865FDF] flex items-center justify-center">
            <GraduationCap size={16} className="text-white" />
          </div>
          <span className="font-semibold text-lg tracking-tight">LiveTrack</span>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-[#a0a0a0]">{user.name}</span>
              <button
                onClick={logout}
                className="text-xs text-[#555555] hover:text-[#a0a0a0] transition-colors px-2 py-1"
              >
                로그아웃
              </button>
              <div className="w-8 h-8 rounded-full bg-[#865FDF] flex items-center justify-center cursor-default">
                <span className="text-sm font-semibold text-white">{user.name[0]}</span>
              </div>
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
      <section className="flex-1 flex flex-col items-center justify-center text-center px-8 py-24">
        <div className="inline-flex items-center gap-2 bg-[#865FDF]/10 border border-[#865FDF]/20 rounded-full px-4 py-1.5 mb-8">
          <Sparkles size={12} className="text-[#865FDF]" />
          <span className="text-xs text-[#c4aff5]">AI 기반 강의 준비 플랫폼</span>
          <MonitorPlay size={12} className="text-[#865FDF]" />
        </div>

        <h1 className="text-5xl font-bold leading-tight max-w-2xl mb-6">
          온라인 강의의{' '}
          <span className="text-[#865FDF]">맥락을 연결</span>하세요
        </h1>

        <p className="text-[#a0a0a0] text-lg max-w-xl leading-relaxed mb-10">
          강의자와 수강생 사이의 인지 단절을 AI로 해결합니다.
          챕터 자동 생성부터 실시간 Q&A, 강의 후 리포트까지.
        </p>

        <div className="flex items-center gap-4">
          <button
            onClick={handleLectureList}
            className="px-7 py-3 rounded-xl border border-[#3a3a3a] hover:border-[#865FDF]/60 text-white font-semibold transition-colors"
          >
            예정된 강의
          </button>
          <button
            onClick={handleCreateLecture}
            className="flex items-center gap-2 bg-[#865FDF] hover:bg-[#7450cc] text-white font-semibold px-7 py-3 rounded-xl transition-colors"
          >
            강의 만들기 <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* Feature cards */}
      <section className="px-8 pb-20">
        <div className="max-w-4xl mx-auto grid grid-cols-4 gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-5 border border-[#1e1e1e] rounded-2xl bg-[#0f0f0f] hover:border-[#865FDF]/30 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-[#865FDF]/10 flex items-center justify-center mb-3">
                <Icon size={16} className="text-[#865FDF]" />
              </div>
              <h3 className="font-semibold text-sm mb-1.5">{title}</h3>
              <p className="text-xs text-[#555555] leading-relaxed whitespace-pre-line">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1e1e1e] px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-[#444444]">
          <span>서비스 이용약관</span>
          <span>개인정보처리방침</span>
        </div>
      </footer>
    </div>
  )
}
