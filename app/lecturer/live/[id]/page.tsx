'use client'

import { use, useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft, ChevronRight, Clock, Users, StopCircle, ArrowLeft, PenLine, MessageSquare, Link2
} from 'lucide-react'
import { ChapterPanel } from '@/components/lecture/chapter-panel'
import { QAPanel } from '@/components/lecture/qa-panel'

import { SlideAnnotator } from '@/components/lecture/slide-annotator'
import { ScreenSharePublisher } from '@/components/lecture/screen-share-publisher'
import { ScreenShareViewer } from '@/components/lecture/screen-share-viewer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useLecture } from '@/contexts/lecture-context'
import { useAuth } from '@/contexts/auth-context'
import { formatElapsed } from '@/lib/mock-data'
import { getSlides, getSlideRatio, restoreSlides } from '@/lib/slide-store'
import type { Question } from '@/lib/types'

export default function LivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { state, dispatch, lectureQuestions } = useLecture()
  const lecture = state.lectures.find(l => l.id === id)

  const [elapsed, setElapsed] = useState(lecture?.session?.elapsedSeconds ?? 0)
  const [linkCopied, setLinkCopied] = useState(false)
  const [slidesReady, setSlidesReady] = useState(() => !!getSlides(id))
  const [studentCount, setStudentCount] = useState(lecture?.studentCount ?? 0)
  const [screenSharing, setScreenSharing] = useState(false)
  const [viewMode, setViewMode] = useState<'slide' | 'screenshare'>('slide')
  const mediamtxUrl = process.env.NEXT_PUBLIC_MEDIAMTX_URL ?? '/api/mediamtx'

  // Auth guard
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'lecturer')) {
      router.replace(`/auth/login?redirect=/lecturer/live/${id}`)
    }
  }, [authLoading, user, router, id])

  function copyLink() {
    if (!lecture) return
    const url = `${window.location.origin}/student/join/${lecture.code}`
    navigator.clipboard.writeText(url).catch(() => {})
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }
  const prevChapterIdRef = useRef(lecture?.session?.currentChapterId ?? '')
  const [annotationOpen, setAnnotationOpen] = useState(false)
  const [qaOpen, setQaOpen] = useState(() => {
    if (typeof window === 'undefined') return true
    const saved = localStorage.getItem('livetrack_qa_panel')
    return saved !== 'false'
  })

  interface QAToast { id: string; content: string; name: string }
  const [toasts, setToasts] = useState<QAToast[]>([])
  const knownQuestionsRef = useRef<Set<string> | null>(null)
  const dismissToast = useCallback((tid: string) => setToasts(t => t.filter(x => x.id !== tid)), [])

  // Restore slides from IndexedDB if not in memory (e.g. after page reload)
  useEffect(() => {
    if (getSlides(id)) { setSlidesReady(true); return }
    restoreSlides(id).then(ok => { if (ok) setSlidesReady(true) })
  }, [id])

  const slides = slidesReady ? getSlides(id) : undefined
  const currentSlideIndex = (lecture?.session?.currentSlide ?? 1) - 1
  const currentSlideImage = slides ? slides[currentSlideIndex] : undefined
  const currentSlideRatio = getSlideRatio(id, currentSlideIndex)

  // Timer
  useEffect(() => {
    if (!lecture || lecture.status !== 'live') return
    const t = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(t)
  }, [lecture?.status])

  // Poll student count every 5s
  useEffect(() => {
    const fetchCount = () =>
      fetch(`/api/lectures/${id}/student-count`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.count !== undefined) setStudentCount(d.count) })
        .catch(() => {})
    fetchCount()
    const t = setInterval(fetchCount, 5000)
    return () => clearInterval(t)
  }, [id])

  // Poll for questions from server every 3s
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch(`/api/lectures/${id}/questions`)
        if (res.ok) {
          const qs: Question[] = await res.json()
          dispatch({ type: '_SYNC_QUESTIONS', lectureId: id, questions: qs })
        }
      } catch {}
    }
    fetchQuestions()
    const t = setInterval(fetchQuestions, 3000)
    return () => clearInterval(t)
  }, [id, dispatch])

  // Keyboard navigation + P to pin/unpin Q&A panel
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (annotationOpen) return
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        dispatch({ type: 'ADVANCE_SLIDE', lectureId: id })
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        dispatch({ type: 'PREV_SLIDE', lectureId: id })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [id, dispatch, annotationOpen])

  // Track chapter changes (for prevChapterIdRef only — no summary on lecturer side)
  useEffect(() => {
    if (!lecture?.session) return
    prevChapterIdRef.current = lecture.session.currentChapterId
  }, [lecture?.session?.currentChapterId])

  // Sync current slide image to localStorage (same-browser) and server (cross-browser)
  useEffect(() => {
    if (!currentSlideImage) return
    try {
      localStorage.setItem(`eduflow-slide-${id}`, currentSlideImage)
    } catch {
      // ignore QuotaExceededError
    }
    fetch(`/api/lectures/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentSlideImage }),
    }).catch(console.error)
  }, [currentSlideImage, id])

  // Clear annotation strokes when the slide changes
  useEffect(() => {
    localStorage.removeItem(`eduflow-strokes-${id}`)
    fetch(`/api/lectures/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentStrokes: null }),
    }).catch(() => {})
  }, [lecture?.session?.currentSlide, id])

  // Toast notifications for new incoming questions
  useEffect(() => {
    const qs = lectureQuestions(id)
    if (knownQuestionsRef.current === null) {
      knownQuestionsRef.current = new Set(qs.map(q => q.id))
      return
    }
    for (const q of qs) {
      if (!knownQuestionsRef.current.has(q.id)) {
        knownQuestionsRef.current.add(q.id)
        const tid = `toast-${q.id}`
        setToasts(t => [...t.slice(-2), { id: tid, content: q.content, name: q.studentName }])
        setTimeout(() => dismissToast(tid), 5000)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.questions, id, dismissToast])

  if (authLoading || !user) return null

  if (!lecture) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f8f8f8]">
        <p className="text-[#aaaaaa]">강의를 찾을 수 없습니다</p>
      </div>
    )
  }

  const session = lecture.session
  const currentChapter = lecture.chapters.find(c => c.id === session?.currentChapterId)
  const slideProgress = session ? Math.round((session.currentSlide / lecture.totalSlides) * 100) : 0
  const questions = lectureQuestions(id)

  return (
    <div className="flex h-screen bg-[#f8f8f8] overflow-hidden relative">
      {/* Left panel - Slide control */}
      <div className="w-[240px] bg-[#0a0a0a] flex flex-col flex-shrink-0">
        {/* Logo + back */}
        <div className="px-4 pt-5 pb-4 border-b border-[#2a2a2a]">
          <Link href="/lecturer" className="flex items-center gap-1.5 text-[#a0a0a0] hover:text-white text-xs transition-colors mb-3">
            <ArrowLeft size={13} /> 대시보드
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
            <span className="text-white text-sm font-semibold truncate">{lecture.title}</span>
          </div>
        </div>

        {/* Timer + students */}
        <div className="px-4 py-4 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-1.5 text-[#a0a0a0] text-xs">
              <Clock size={12} />
              <span className="font-mono">{formatElapsed(elapsed)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#a0a0a0] text-xs">
              <Users size={12} />
              <span>{studentCount}명</span>
            </div>
          </div>
          <Progress value={slideProgress} color="#865FDF" height={3} />
          <p className="text-[10px] text-[#555555] mt-1.5">
            슬라이드 {session?.currentSlide}/{lecture.totalSlides}
          </p>
        </div>

        {/* Current chapter */}
        <div className="px-4 py-4 border-b border-[#2a2a2a]">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#555555] mb-2">현재 챕터</p>
          <p className="text-white text-sm font-medium leading-tight">{currentChapter?.title ?? '—'}</p>
          <p className="text-[#555555] text-xs mt-1">
            {currentChapter && `슬라이드 ${currentChapter.slideRange[0]}–${currentChapter.slideRange[1]}장`}
          </p>
        </div>

        {/* Slide navigation */}
        <div className="px-4 py-4 border-b border-[#2a2a2a]">
          {/* Slide thumbnail */}
          <div className="w-full aspect-video bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] overflow-hidden mb-3 flex items-center justify-center">
            {currentSlideImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentSlideImage} alt="" className="w-full h-full object-contain" />
            ) : (
              <span className="text-[#555555] text-xs">슬라이드 {session?.currentSlide}</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => dispatch({ type: 'PREV_SLIDE', lectureId: id })}
              disabled={session?.currentSlide === 1}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-[#2a2a2a] text-[#a0a0a0] hover:text-white hover:border-[#555555] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs"
            >
              <ChevronLeft size={14} /> 이전
            </button>
            <button
              onClick={() => dispatch({ type: 'ADVANCE_SLIDE', lectureId: id })}
              disabled={session?.currentSlide === lecture.totalSlides}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-[#865FDF] hover:bg-[#7450cc] text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs"
            >
              다음 <ChevronRight size={14} />
            </button>
          </div>
          <p className="text-[10px] text-[#555555] text-center mt-2">
            ← → 키보드로도 이동 가능
          </p>
        </div>

        {/* End lecture */}
        <div className="mt-auto px-4 py-4">
          <Link
            href={`/lecturer/report/${id}`}
            onClick={() => dispatch({ type: 'END_LECTURE', lectureId: id })}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-[#ef4444]/30 text-[#ef4444] hover:bg-[#ef4444]/10 text-sm transition-colors"
          >
            <StopCircle size={15} /> 강의 종료
          </Link>
        </div>
      </div>

      {/* Center - Main slide view */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Top bar */}
        <div className="h-14 bg-white border-b border-[#e5e5e5] flex items-center px-6 gap-4 flex-shrink-0">
          <Badge variant="green">LIVE</Badge>
          <span className="text-sm font-medium text-[#111111]">{lecture.title}</span>
          <span className="text-xs text-[#aaaaaa]">참여 코드: <strong className="text-[#865FDF]">{lecture.code}</strong></span>
          <button
            onClick={copyLink}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors
              ${linkCopied
                ? 'border-[#22c55e] text-[#22c55e] bg-green-50'
                : 'border-[#e5e5e5] text-[#555555] hover:border-[#865FDF] hover:text-[#865FDF]'
              }`}
          >
            <Link2 size={12} />
            {linkCopied ? '복사됨!' : '링크 복사'}
          </button>
          <div className="ml-auto flex items-center gap-2">
            <ScreenSharePublisher
              lectureId={id}
              mediamtxUrl={mediamtxUrl}
              onStateChange={sharing => {
                setScreenSharing(sharing)
                if (sharing) setViewMode('screenshare')
                else setViewMode('slide')
              }}
            />
            <button
              onClick={() => setAnnotationOpen(v => !v)}
              disabled={screenSharing}
              title="펜/형광펜 도구"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 ${
                annotationOpen
                  ? 'bg-[#865FDF] text-white'
                  : 'border border-[#e5e5e5] text-[#555555] hover:border-[#865FDF] hover:text-[#865FDF]'
              }`}
            >
              <PenLine size={15} />
              {annotationOpen ? '도구 닫기' : '필기 도구'}
            </button>
          </div>
        </div>

        {/* Slide area */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div
            className="bg-white border border-[#e5e5e5] rounded-2xl shadow-sm flex flex-col items-center justify-center relative overflow-hidden"
            style={{
              cursor: annotationOpen ? 'crosshair' : undefined,
              aspectRatio: String(currentSlideRatio),
              maxHeight: 'calc(100vh - 7rem)',
              maxWidth: '100%',
              width: `min(100%, calc((100vh - 7rem) * ${currentSlideRatio}))`,
            }}
          >
            {currentSlideImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentSlideImage}
                alt={`슬라이드 ${session?.currentSlide}`}
                className="absolute inset-0 w-full h-full object-contain"
              />
            ) : (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-[#f0ebff] to-white opacity-30" />
                <div className="relative text-center px-12">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#865FDF] mb-3">{currentChapter?.title}</p>
                  <h2 className="text-3xl font-bold text-[#111111] mb-3">슬라이드 {session?.currentSlide}</h2>
                  <p className="text-sm text-[#aaaaaa]">준비 단계에서 PDF를 업로드하면 슬라이드가 표시됩니다</p>
                </div>
              </>
            )}
            {/* Slide number */}
            <div className="absolute bottom-4 right-4 text-xs text-[#cccccc]">
              {session?.currentSlide} / {lecture.totalSlides}
            </div>
            {/* Annotation canvas overlay */}
            {annotationOpen && (
              <SlideAnnotator onClose={() => setAnnotationOpen(false)} lectureId={id} />
            )}
            {/* Screen share overlay (lecturer preview) */}
            {screenSharing && viewMode === 'screenshare' && (
              <ScreenShareViewer lectureId={id} mediamtxUrl={mediamtxUrl} active={true} />
            )}
          </div>

          {/* View toggle — only when screen sharing */}
          {screenSharing && (
            <div className="flex gap-3 mt-4">
              {(['slide', 'screenshare'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`flex-1 max-w-[180px] py-3 rounded-xl text-sm font-semibold border-2 transition-colors
                    ${viewMode === mode
                      ? 'border-[#865FDF] text-[#865FDF] bg-[#f0ebff]'
                      : 'border-[#e5e5e5] text-[#aaaaaa] hover:border-[#865FDF]/40 hover:text-[#555555]'
                    }`}
                >
                  {mode === 'slide' ? '슬라이드' : '화면공유'}
                </button>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Toggle button */}
      <button
        onClick={() => setQaOpen(v => {
          const next = !v
          localStorage.setItem('livetrack_qa_panel', String(next))
          return next
        })}
        className="flex-shrink-0 self-center w-5 h-12 flex items-center justify-center bg-white border-y border-l border-[#e5e5e5] rounded-l-lg text-[#aaaaaa] hover:text-[#865FDF] hover:border-[#865FDF]/40 transition-colors z-10"
        title={qaOpen ? '패널 닫기' : '패널 열기'}
      >
        {qaOpen ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>

      {/* Right panel — collapsible Q&A sidebar */}
      {qaOpen && <div className="w-[320px] flex-shrink-0 bg-white border-l border-[#e5e5e5] flex flex-col">
        <QAPanel
          questions={questions}
          mode="lecturer"
          lectureId={id}
          currentChapterId={session?.currentChapterId}
          onLike={qid => dispatch({ type: 'LIKE_QUESTION', questionId: qid })}
          onAnswer={qid => dispatch({ type: 'ANSWER_QUESTION', questionId: qid })}
          onAnswerWithText={(qid, answer) => dispatch({ type: 'ANSWER_QUESTION_WITH_TEXT', questionId: qid, answer })}
          lectureTitle={lecture.title}
          currentChapterTitle={currentChapter?.title}
          currentChapterSummary={currentChapter?.summary}
          onClearAll={() => dispatch({ type: 'CLEAR_QUESTIONS', lectureId: id })}
          userName={user.name}
          onSubmit={async (content, name) => {
            const q = {
              id: crypto.randomUUID(),
              lecture_id: id,
              chapterId: session?.currentChapterId ?? '',
              studentName: name,
              content,
              createdAt: new Date().toISOString(),
            }
            await fetch(`/api/lectures/${id}/questions`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(q),
            })
          }}
        />
      </div>}

      {/* Toast notifications */}
      <div
        className="absolute top-16 z-50 flex flex-col gap-2 pointer-events-none"
        style={{ maxWidth: '280px', right: qaOpen ? '328px' : '8px' }}
      >
        {toasts.map(t => (
          <div
            key={t.id}
            className="bg-white border border-[#e5e5e5] rounded-2xl shadow-lg px-4 py-3 animate-slide-up pointer-events-auto"
          >
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare size={12} className="text-[#865FDF] flex-shrink-0" />
              <span className="text-[11px] font-semibold text-[#865FDF]">새 질문</span>
              <span className="text-[11px] text-[#aaaaaa] ml-auto">{t.name}</span>
              <button onClick={() => dismissToast(t.id)} className="text-[#cccccc] hover:text-[#aaaaaa] ml-1 text-xs">✕</button>
            </div>
            <p className="text-xs text-[#111111] leading-relaxed line-clamp-2">{t.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
