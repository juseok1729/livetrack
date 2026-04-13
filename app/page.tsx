'use client'

import { useRouter } from 'next/navigation'
import { GraduationCap, Sparkles, BookOpen, MessageSquare, LogIn } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useLecture } from '@/contexts/lecture-context'
import type { Lecture } from '@/lib/types'

function ChapterGenIllustration() {
  return (
    <div className="flex flex-col gap-2 px-1">
      {/* File upload row */}
      <div className="flex items-center gap-2 bg-[#f0ebff] rounded-lg px-3 py-2">
        <div className="w-7 h-8 bg-[#865FDF] rounded flex items-center justify-center flex-shrink-0">
          <span className="text-white text-[8px] font-bold">PPT</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-medium text-[#333] truncate">Ch1_01. PM 직무와 개념…</div>
          <div className="text-[9px] text-[#865FDF]">업로드 완료 · 17장</div>
        </div>
      </div>
      {/* AI analyzing */}
      <div className="flex items-center gap-1.5 px-1 py-1">
        <div className="w-3 h-3 rounded-full bg-[#865FDF]/20 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-[#865FDF] animate-pulse" />
        </div>
        <span className="text-[9px] text-[#865FDF] font-medium">AI 챕터 생성 완료</span>
      </div>
      {/* Chapter list */}
      {[
        { title: 'PM 개념 소개', range: '1–4장', done: true },
        { title: '역할과 직무 차이', range: '5–9장', done: true },
        { title: '성과와 핵심 지표', range: '10–14장', done: false },
      ].map((ch, i) => (
        <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[#e5e5e5]">
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ch.done ? 'bg-[#22c55e]' : 'bg-[#865FDF]'}`} />
          <span className="text-[10px] font-medium text-[#222] flex-1">{ch.title}</span>
          <span className="text-[9px] text-[#aaa]">{ch.range}</span>
        </div>
      ))}
      {/* Bottom row */}
      <div className="flex items-center gap-1 px-1">
        <div className="h-1 flex-1 rounded bg-[#e5e5e5] overflow-hidden">
          <div className="h-full w-2/3 bg-[#865FDF] rounded" />
        </div>
        <span className="text-[9px] text-[#aaa]">3/5 챕터</span>
      </div>
    </div>
  )
}

function ChapterStatusIllustration() {
  return (
    <div className="flex flex-col gap-2 px-1">
      {/* Progress */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[9px] text-[#aaa]">강의 진행</span>
        <span className="text-[9px] font-semibold text-[#865FDF]">72%</span>
      </div>
      <div className="h-1.5 bg-[#f0ebff] rounded-full overflow-hidden mx-1">
        <div className="h-full bg-[#865FDF] rounded-full" style={{ width: '72%' }} />
      </div>
      {/* Chapters */}
      <div className="flex flex-col gap-1.5 mt-1">
        {[
          { label: '01', title: 'PM 개념 소개', status: 'done', time: '12분' },
          { label: '02', title: '역할과 직무 차이', status: 'done', time: '8분' },
          { label: '03', title: '성과와 핵심 지표', status: 'active', time: null },
        ].map((ch) => (
          <div key={ch.label} className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border ${ch.status === 'active' ? 'bg-[#f0ebff] border-[#865FDF]/30' : 'bg-white border-[#e5e5e5]'}`}>
            <span className="text-[8px] font-bold text-[#ccc] w-3">{ch.label}</span>
            <span className={`text-[10px] flex-1 font-medium ${ch.status === 'active' ? 'text-[#865FDF]' : 'text-[#555]'}`}>{ch.title}</span>
            {ch.time ? (
              <span className="text-[9px] text-[#aaa]">{ch.time}</span>
            ) : (
              <span className="text-[8px] bg-[#865FDF] text-white px-1.5 py-0.5 rounded-full">진행중</span>
            )}
          </div>
        ))}
      </div>
      {/* AI summary box */}
      <div className="bg-[#f8f6ff] border border-[#865FDF]/20 rounded-lg px-2.5 py-2 mx-0.5">
        <div className="text-[8px] font-semibold text-[#865FDF] mb-1">AI 요약</div>
        <div className="space-y-0.5">
          <div className="h-1.5 bg-[#e8e0ff] rounded w-full" />
          <div className="h-1.5 bg-[#e8e0ff] rounded w-4/5" />
          <div className="h-1.5 bg-[#e8e0ff] rounded w-3/5" />
        </div>
      </div>
    </div>
  )
}

function QASummaryIllustration() {
  return (
    <div className="flex flex-col gap-2 px-1">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-semibold text-[#333]">Q&A</span>
        <span className="text-[8px] bg-[#f3f3f3] text-[#888] px-2 py-0.5 rounded-full">인기순 ▾</span>
      </div>
      {/* Question cards */}
      {[
        { q: 'PM과 PO의 역할 차이는\n무엇인가요?', likes: 12, answered: true },
        { q: '성과를 어떻게 측정하나요?', likes: 8, answered: false },
        { q: 'KPI 설정 기준이 궁금해요', likes: 5, answered: false },
      ].map((item, i) => (
        <div key={i} className="bg-white border border-[#e5e5e5] rounded-xl px-3 py-2">
          <p className="text-[10px] text-[#222] leading-tight mb-2 whitespace-pre-line">{item.q}</p>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#865FDF" strokeWidth="2">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
              </svg>
              <span className="text-[9px] font-semibold text-[#865FDF]">{item.likes}</span>
            </div>
            {item.answered && (
              <span className="text-[8px] bg-[#f0fdf4] text-[#22c55e] border border-[#22c55e]/20 px-1.5 py-0.5 rounded-full ml-auto">답변완료</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

const featureCards = [
  { icon: Sparkles,      title: 'AI 챕터 자동 생성',         Illustration: ChapterGenIllustration },
  { icon: BookOpen,      title: '실시간 챕터 현황 및 AI 요약', Illustration: ChapterStatusIllustration },
  { icon: MessageSquare, title: 'AI 질문 요약',               Illustration: QASummaryIllustration },
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
          {featureCards.map(({ icon: Icon, title, Illustration }) => (
            <div key={title} className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col" style={{ height: '300px' }}>
              <div className="flex items-center gap-2 px-5 pt-5 pb-3 flex-shrink-0">
                <Icon size={16} className="text-[#865FDF]" />
                <h3 className="font-semibold text-sm text-gray-800">{title}</h3>
              </div>
              <div className="flex-1 px-4 pb-4 overflow-hidden">
                <div className="h-full bg-[#fafafa] rounded-xl p-3 overflow-hidden">
                  <Illustration />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
