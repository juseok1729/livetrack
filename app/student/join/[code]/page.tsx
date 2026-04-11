'use client'

import { use, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, BookOpen, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react'
import { ChapterPanel } from '@/components/lecture/chapter-panel'
import { QAPanel } from '@/components/lecture/qa-panel'
import { AISummaryCard } from '@/components/lecture/ai-summary-card'
import { StrokeOverlay } from '@/components/lecture/stroke-overlay'
import { Badge } from '@/components/ui/badge'
import { useLecture } from '@/contexts/lecture-context'
import { useAuth } from '@/contexts/auth-context'
import type { Question } from '@/lib/types'

type Tab = 'chapters' | 'qa'
const PANEL_KEY = 'eduflow_panel_open'

export default function StudentJoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { state, dispatch, lectureQuestions } = useLecture()

  const lecture = state.lectures.find(l => l.code === code.toUpperCase())
  const [tab, setTab] = useState<Tab>('chapters')
  const [showSummary, setShowSummary] = useState(false)
  const [summaryData, setSummaryData] = useState({ chapter: '', text: '' })
  const prevChapterIdRef = useRef(lecture?.session?.currentChapterId ?? '')
  const [liveSlideImage, setLiveSlideImage] = useState<string>('')
  const [panelOpen, setPanelOpen] = useState(true)

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/auth/login?redirect=/student/join/${code}`)
    }
  }, [authLoading, user, router, code])

  // Restore panel state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(PANEL_KEY)
    if (saved !== null) setPanelOpen(saved === 'true')
  }, [])

  function togglePanel() {
    setPanelOpen(v => {
      localStorage.setItem(PANEL_KEY, String(!v))
      return !v
    })
  }

  // Read initial slide image
  useEffect(() => {
    if (!lecture?.id) return
    const img = localStorage.getItem(`eduflow-slide-${lecture.id}`)
    if (img) setLiveSlideImage(img)
  }, [lecture?.id])

  // Listen for slide updates
  useEffect(() => {
    if (!lecture?.id) return
    const key = `eduflow-slide-${lecture.id}`
    function onStorage(e: StorageEvent) {
      if (e.key === key && e.newValue) setLiveSlideImage(e.newValue)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [lecture?.id])

  // Detect chapter change → show AI summary
  useEffect(() => {
    if (!lecture?.session) return
    const curr = lecture.session.currentChapterId
    const prev = prevChapterIdRef.current
    if (curr !== prev && prev) {
      const prevCh = lecture.chapters.find(c => c.id === prev)
      if (prevCh?.summary) {
        setSummaryData({ chapter: prevCh.title, text: prevCh.summary })
        setShowSummary(true)
      }
    }
    prevChapterIdRef.current = curr
  }, [lecture?.session?.currentChapterId, lecture?.chapters])

  if (authLoading || !user) return null

  // Lecture not found
  if (!lecture) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#f0ebff] flex items-center justify-center mx-auto mb-4">
            <BookOpen size={28} className="text-[#865FDF]" />
          </div>
          <h2 className="text-lg font-bold text-[#111111] mb-2">존재하지 않는 강의입니다</h2>
          <p className="text-sm text-[#555555]">코드 <strong>{code.toUpperCase()}</strong>에 해당하는 강의를 찾을 수 없습니다</p>
          <button onClick={() => router.push('/')} className="mt-5 text-sm text-[#865FDF] hover:underline">홈으로 돌아가기</button>
        </div>
      </div>
    )
  }

  // Lecture ended
  if (lecture.status === 'ended') {
    return (
      <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#f3f3f3] flex items-center justify-center mx-auto mb-4">
            <BookOpen size={28} className="text-[#aaaaaa]" />
          </div>
          <h2 className="text-lg font-bold text-[#111111] mb-2">강의가 종료되었습니다</h2>
          <p className="text-sm text-[#555555]">{lecture.title} 강의가 이미 종료되었습니다.</p>
          <button onClick={() => router.push('/')} className="mt-5 text-sm text-[#865FDF] hover:underline">홈으로 돌아가기</button>
        </div>
      </div>
    )
  }

  // Waiting screen (preparing)
  if (lecture.status === 'preparing') {
    return (
      <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-[#865FDF]/10 animate-ping" />
            <div className="relative w-20 h-20 rounded-full bg-[#f0ebff] flex items-center justify-center">
              <Sparkles size={32} className="text-[#865FDF]" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-[#111111] mb-2">
            안녕하세요, {user.name}님.
          </h2>
          <p className="text-base text-[#555555] mb-1">강의 시작을 기다리고 있어요</p>
          <p className="text-sm text-[#aaaaaa]">{lecture.title}</p>
          <div className="flex items-center justify-center gap-1.5 mt-6">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-[#865FDF]/40 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Live view
  const session = lecture.session
  const currentChapter = lecture.chapters.find(c => c.id === session?.currentChapterId)
  const questions = lectureQuestions(lecture.id)
  const unansweredCount = questions.filter(q => !q.answered).length

  function handleLike(id: string) {
    dispatch({ type: 'LIKE_QUESTION', questionId: id })
  }

  function handleSubmitQuestion(content: string, name: string) {
    const q: Question = {
      id: `q-student-${Date.now()}`,
      lectureId: lecture!.id,
      chapterId: session?.currentChapterId ?? '',
      studentName: name,
      content,
      likes: 0,
      answered: false,
      createdAt: new Date().toISOString(),
    }
    dispatch({ type: 'ADD_QUESTION', question: q })
  }

  return (
    <div className="flex h-screen bg-[#f8f8f8] overflow-hidden">
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Top bar */}
        <div className="h-14 bg-white border-b border-[#e5e5e5] flex items-center px-6 gap-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Badge variant="green">LIVE</Badge>
            <span className="text-sm font-semibold text-[#111111]">{lecture.title}</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {currentChapter && (
              <div className="flex items-center gap-1.5 text-xs text-[#555555] bg-[#f3f3f3] px-3 py-1.5 rounded-lg">
                <BookOpen size={12} className="text-[#865FDF]" />
                <span>{currentChapter.title}</span>
              </div>
            )}
            <span className="text-xs text-[#aaaaaa]">
              {session?.currentSlide}/{lecture.totalSlides} 슬라이드
            </span>
            <span className="text-xs text-[#aaaaaa] border-l border-[#e5e5e5] pl-3">{user.name}</span>
          </div>
        </div>

        {/* Lecture area */}
        <div className="flex-1 flex items-center justify-center p-8 relative">
          <div className="w-full max-w-4xl aspect-video bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] relative overflow-hidden shadow-lg">
            {liveSlideImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={liveSlideImage} alt={`슬라이드 ${session?.currentSlide}`} className="w-full h-full object-contain" />
            ) : (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-[#865FDF]/5 to-transparent" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Sparkles size={32} className="text-[#865FDF]/30 mb-4" />
                  <p className="text-[#555555] text-sm">강의 화면이 여기에 표시됩니다</p>
                </div>
              </>
            )}
            <StrokeOverlay lectureId={lecture.id} />
            {session && (
              <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/60 rounded-lg px-3 py-1.5" style={{ zIndex: 20 }}>
                <div className="w-1.5 h-1.5 rounded-full bg-[#865FDF]" />
                <span className="text-white text-xs">슬라이드 {session.currentSlide} · {currentChapter?.title}</span>
              </div>
            )}
          </div>

          {showSummary && (
            <div className="absolute bottom-8 left-8 z-20">
              <AISummaryCard chapterTitle={summaryData.chapter} summary={summaryData.text} onClose={() => setShowSummary(false)} />
            </div>
          )}
        </div>
      </div>

      {/* Toggle button on the edge */}
      <button
        onClick={togglePanel}
        className="flex-shrink-0 self-center w-6 h-12 flex items-center justify-center bg-white border border-[#e5e5e5] rounded-l-xl text-[#aaaaaa] hover:text-[#865FDF] hover:border-[#865FDF]/40 transition-colors z-10 shadow-sm"
        title={panelOpen ? '패널 닫기' : '패널 열기'}
      >
        {panelOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Right panel */}
      {panelOpen && (
        <div className="w-[320px] bg-white border-l border-[#e5e5e5] flex flex-col flex-shrink-0">
          <div className="flex border-b border-[#e5e5e5] flex-shrink-0">
            {([
              { key: 'chapters' as const, label: '챕터', icon: BookOpen },
              { key: 'qa' as const, label: `Q&A${unansweredCount > 0 ? ` (${unansweredCount})` : ''}`, icon: MessageSquare },
            ]).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-medium transition-colors border-b-2
                  ${tab === key ? 'border-[#865FDF] text-[#865FDF]' : 'border-transparent text-[#aaaaaa] hover:text-[#555555]'}`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden">
            {tab === 'chapters' ? (
              <ChapterPanel
                chapters={lecture.chapters}
                currentChapterId={session?.currentChapterId ?? ''}
                currentSlide={session?.currentSlide ?? 1}
                totalSlides={lecture.totalSlides}
                mode="student"
                startedAt={session?.startedAt}
              />
            ) : (
              <QAPanel
                questions={questions}
                mode="student"
                lectureId={lecture.id}
                currentChapterId={session?.currentChapterId}
                onLike={handleLike}
                onSubmit={handleSubmitQuestion}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
