'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Play, BookOpen, BarChart3, Users, Clock, ChevronRight, PlusCircle, Link2, LogOut, Trash2 } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useLecture } from '@/contexts/lecture-context'
import { useAuth } from '@/contexts/auth-context'
import type { Lecture } from '@/lib/types'

const statusLabel = { preparing: '준비 중', live: '진행 중', ended: '종료됨' }
const statusVariant = { preparing: 'yellow', live: 'green', ended: 'gray' } as const

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function LecturerDashboard() {
  const router = useRouter()
  const { user, loading: authLoading, logout } = useAuth()
  const { state, dispatch } = useLecture()
  const { lectures } = state
  const [copyToast, setCopyToast] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Auth guard
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'lecturer')) {
      router.replace('/auth/login?redirect=/lecturer')
    }
  }, [authLoading, user, router])

  if (authLoading || !user) return null

  const live = lectures.filter(l => l.status === 'live')
  const preparing = lectures.filter(l => l.status === 'preparing')
  const ended = lectures.filter(l => l.status === 'ended')

  function copyLink(code: string) {
    const url = `${window.location.origin}/student/join/${code}`
    navigator.clipboard.writeText(url).catch(() => {})
    setCopyToast(code)
    setTimeout(() => setCopyToast(''), 2000)
  }

  function createLecture() {
    const code = generateCode()
    const id = `lec-${Date.now()}`
    const newLecture: Lecture = {
      id,
      title: '새 강의',
      code,
      status: 'preparing',
      totalSlides: 1,
      chapters: [],
      studentCount: 0,
      createdAt: new Date().toISOString(),
    }
    dispatch({ type: 'ADD_LECTURE', lecture: newLecture })
    router.push(`/lecturer/prepare/${id}`)
  }

  function LinkCopyButton({ lec }: { lec: Lecture }) {
    const copied = copyToast === lec.code
    return (
      <button
        onClick={e => { e.preventDefault(); copyLink(lec.code) }}
        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors
          ${copied
            ? 'border-[#22c55e] text-[#22c55e] bg-green-50'
            : 'border-[#e5e5e5] text-[#555555] hover:border-[#865FDF] hover:text-[#865FDF]'
          }`}
      >
        <Link2 size={12} />
        {copied ? '복사됨!' : '링크 복사'}
      </button>
    )
  }

  function DeleteButton({ lec }: { lec: Lecture }) {
    const confirming = deleteConfirm === lec.id
    return confirming ? (
      <div className="flex items-center gap-1">
        <button
          onClick={e => { e.preventDefault(); dispatch({ type: 'REMOVE_LECTURE', lectureId: lec.id }); setDeleteConfirm(null) }}
          className="text-xs px-2.5 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
        >삭제</button>
        <button
          onClick={e => { e.preventDefault(); setDeleteConfirm(null) }}
          className="text-xs px-2.5 py-1.5 rounded-lg border border-[#e5e5e5] text-[#555555] hover:bg-[#f5f5f5] transition-colors"
        >취소</button>
      </div>
    ) : (
      <button
        onClick={e => { e.preventDefault(); setDeleteConfirm(lec.id) }}
        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-[#e5e5e5] text-[#aaaaaa] hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-colors"
      >
        <Trash2 size={12} />
      </button>
    )
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#111111]">강의 대시보드</h1>
          <p className="text-sm text-[#555555] mt-1">강의를 관리하고 새 강의를 시작하세요</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-[#555555]">
            <div className="w-7 h-7 rounded-full bg-[#f0ebff] flex items-center justify-center">
              <span className="text-xs font-semibold text-[#865FDF]">{user.name[0]}</span>
            </div>
            <span>{user.name}</span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs text-[#888888] hover:text-[#ef4444] px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut size={13} /> 로그아웃
          </button>
          <button
            onClick={createLecture}
            className="flex items-center gap-2 bg-[#865FDF] hover:bg-[#7450cc] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <PlusCircle size={16} />
            새 강의 만들기
          </button>
        </div>
      </div>

      {/* Copy toast */}
      {copyToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#111111] text-white text-sm px-4 py-2.5 rounded-xl shadow-lg z-50 animate-fade-in">
          링크가 복사되었습니다
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: '전체 강의', value: lectures.length, icon: BookOpen, color: '#865FDF' },
          { label: '진행 중', value: live.length, icon: Play, color: '#22c55e' },
          { label: '총 수강생', value: lectures.reduce((s, l) => s + (l.studentCount ?? 0), 0), icon: Users, color: '#f59e0b' },
          { label: '강의 시간', value: '75분', icon: Clock, color: '#3b82f6' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-[#aaaaaa]">{label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
                <Icon size={15} style={{ color }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#111111]">{value}</p>
          </Card>
        ))}
      </div>

      {/* Live lectures */}
      {live.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-[#111111] mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
            진행 중인 강의
          </h2>
          <div className="grid gap-3">
            {live.map(lec => (
              <Card key={lec.id} className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="green">LIVE</Badge>
                      <span className="text-xs text-[#aaaaaa]">코드: {lec.code}</span>
                    </div>
                    <h3 className="font-semibold text-[#111111]">{lec.title}</h3>
                    <p className="text-xs text-[#555555] mt-1">
                      슬라이드 {lec.session?.currentSlide}/{lec.totalSlides} ·{' '}
                      {lec.chapters.find(c => c.id === lec.session?.currentChapterId)?.title} ·{' '}
                      수강생 {lec.studentCount}명
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <LinkCopyButton lec={lec} />
                    <Link
                      href={`/lecturer/live/${lec.id}`}
                      className="flex items-center gap-2 bg-[#865FDF] hover:bg-[#7450cc] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                      <Play size={14} /> 강의실 입장
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Preparing */}
      {preparing.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-[#111111] mb-3">준비 중인 강의</h2>
          <div className="grid gap-3">
            {preparing.map(lec => (
              <Card key={lec.id} className="p-5 hover:border-[#865FDF]/30 transition-colors" hover>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="yellow">{statusLabel[lec.status]}</Badge>
                      <span className="text-xs text-[#aaaaaa]">{lec.chapters.length}개 챕터</span>
                    </div>
                    <h3 className="font-semibold text-[#111111]">{lec.title}</h3>
                    {lec.description && <p className="text-xs text-[#555555] mt-1">{lec.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <DeleteButton lec={lec} />
                    <LinkCopyButton lec={lec} />
                    <Link href={`/lecturer/prepare/${lec.id}`} className="flex items-center gap-1.5 text-sm text-[#865FDF] hover:text-[#7450cc] font-medium px-3 py-2 rounded-lg hover:bg-[#f0ebff] transition-colors">
                      <BookOpen size={14} /> 편집
                    </Link>
                    <ChevronRight size={16} className="text-[#cccccc]" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Ended */}
      {ended.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[#111111] mb-3">종료된 강의</h2>
          <div className="grid gap-3">
            {ended.map(lec => (
              <Card key={lec.id} className="p-5" hover>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="gray">{statusLabel[lec.status]}</Badge>
                      <span className="text-xs text-[#aaaaaa]">수강생 {lec.studentCount}명</span>
                    </div>
                    <h3 className="font-semibold text-[#111111]">{lec.title}</h3>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <DeleteButton lec={lec} />
                    <Link href={`/lecturer/report/${lec.id}`} className="flex items-center gap-1.5 text-sm text-[#555555] hover:text-[#865FDF] font-medium px-3 py-2 rounded-lg hover:bg-[#f0ebff] transition-colors">
                      <BarChart3 size={14} /> 리포트 보기
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </AppLayout>
  )
}
