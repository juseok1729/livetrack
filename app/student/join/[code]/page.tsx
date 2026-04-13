'use client'

import { use, useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, BookOpen, Sparkles, ChevronRight, ChevronLeft, GraduationCap, ArrowRight, Monitor, GalleryHorizontalEnd, LogOut, Video, VideoOff, Users } from 'lucide-react'
import { ChapterPanel } from '@/components/lecture/chapter-panel'
import { QAPanel } from '@/components/lecture/qa-panel'
import { AISummaryCard } from '@/components/lecture/ai-summary-card'
import { StrokeOverlay } from '@/components/lecture/stroke-overlay'
import { ScreenShareViewer } from '@/components/lecture/screen-share-viewer'
import { StudentCamPublisher } from '@/components/lecture/student-cam-publisher'
import { Badge } from '@/components/ui/badge'
import type { Lecture, Question } from '@/lib/types'

type Tab = 'chapters' | 'qa' | 'users'
const PANEL_KEY = 'eduflow_panel_open'
const NICKNAME_KEY = 'livetrack_nickname'
const POLL_INTERVAL = 2500
const LECTURE_FALLBACK_MS = 10000

type StudentLecture = Lecture & { currentSlideImage?: string | null; currentStrokes?: string | null }

export default function StudentJoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const router = useRouter()

  // Nickname / lobby state
  const [nickname, setNickname] = useState<string | null>(null)
  const [nicknameInput, setNicknameInput] = useState('')
  const [cameraOn, setCameraOn] = useState(false)
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [lecture, setLecture] = useState<StudentLecture | null | undefined>(undefined)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [tab, setTab] = useState<Tab>('chapters')
  const [showSummary, setShowSummary] = useState(false)
  const [summaryData, setSummaryData] = useState({ chapter: '', text: '' })
  const prevChapterIdRef = useRef('')
  const [panelOpen, setPanelOpen] = useState(true)
  const [slideRatio, setSlideRatio] = useState<number>(16 / 9)
  const [screenSharing, setScreenSharing] = useState(false)
  const [viewMode, setViewMode] = useState<'slide' | 'screenshare'>('slide')
  const mediamtxUrl = process.env.NEXT_PUBLIC_MEDIAMTX_URL ?? '/api/mediamtx'
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const likedIdsRef = useRef(likedIds)
  likedIdsRef.current = likedIds

  const [presenceList, setPresenceList] = useState<string[]>([])
  const [cameraList, setCameraList] = useState<{nickname: string; streamPath: string}[]>([])

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
    }
  }, [])

  // Restore saved nickname & panel state
  useEffect(() => {
    const saved = localStorage.getItem(NICKNAME_KEY)
    if (saved) setNicknameInput(saved)
    const panel = localStorage.getItem(PANEL_KEY)
    if (panel !== null) setPanelOpen(panel === 'true')
  }, [])

  function togglePanel() {
    setPanelOpen(v => {
      localStorage.setItem(PANEL_KEY, String(!v))
      return !v
    })
  }

  function handleEnter() {
    const name = nicknameInput.trim() || '익명'
    localStorage.setItem(NICKNAME_KEY, name)
    // Transfer camera stream to live view (publisher will stop it on unmount)
    if (cameraOn && streamRef.current) {
      setActiveStream(streamRef.current)
      streamRef.current = null
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
    }
    setNickname(name)
  }

  async function toggleCamera(on: boolean) {
    setCameraOn(on)
    if (!on) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
      if (videoRef.current) videoRef.current.srcObject = null
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch {
      setCameraOn(false)
    }
  }

  // Fetch lecture state
  const fetchLecture = useCallback(async () => {
    try {
      const res = await fetch(`/api/lectures/by-code/${code}`)
      if (!res.ok) { setLecture(null); return }
      const data = await res.json()
      if (!data) { setLecture(null); return }
      setLecture(data)
    } catch {}
  }, [code])

  // Fetch questions
  const fetchQuestions = useCallback(async (lectureId: string) => {
    try {
      const qRes = await fetch(`/api/lectures/${lectureId}/questions`)
      if (qRes.ok) {
        const qs: Question[] = await qRes.json()
        const liked = likedIdsRef.current
        setQuestions(qs.map(q => ({ ...q, likedByMe: liked.has(q.id) })))
      }
    } catch {}
  }, [])

  // Fetch first slide thumbnail for lobby
  useEffect(() => {
    if (!lecture?.id || thumbnailUrl !== null) return
    fetch(`/api/lectures/${lecture.id}/slides`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.images?.[0]) setThumbnailUrl(data.images[0]) })
      .catch(() => {})
  }, [lecture?.id, thumbnailUrl])

  // Initial load + fallback polling
  useEffect(() => {
    fetchLecture()
    const t = setInterval(fetchLecture, LECTURE_FALLBACK_MS)
    return () => clearInterval(t)
  }, [fetchLecture])

  // Question polling (only after entering)
  useEffect(() => {
    if (!nickname || !lecture?.id) return
    fetchQuestions(lecture.id)
    const t = setInterval(() => fetchQuestions(lecture.id), POLL_INTERVAL)
    return () => clearInterval(t)
  }, [nickname, lecture?.id, fetchQuestions])

  // Presence registration + heartbeat every 20s (re-registers if server restarts)
  useEffect(() => {
    if (!nickname || !lecture?.id) return
    const lectureId = lecture.id
    const register = () => fetch(`/api/lectures/${lectureId}/presence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname }),
    }).catch(() => {})
    register()
    const heartbeat = setInterval(register, 20000)
    const unregister = () => {
      fetch(`/api/lectures/${lectureId}/presence`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname }),
        keepalive: true,
      }).catch(() => {})
    }
    window.addEventListener('beforeunload', unregister)
    return () => {
      clearInterval(heartbeat)
      window.removeEventListener('beforeunload', unregister)
      fetch(`/api/lectures/${lectureId}/presence`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname }),
      }).catch(() => {})
    }
  }, [nickname, lecture?.id])

  // SSE
  useEffect(() => {
    if (!nickname || !lecture?.id) return
    const es = new EventSource(`/api/lectures/${lecture.id}/stream`)
    es.onmessage = (e) => {
      try {
        const update = JSON.parse(e.data)
        setLecture(prev => {
          if (!prev) return prev
          const next = { ...prev }
          if (update.status !== undefined) next.status = update.status
          if (update.currentSlideImage !== undefined) next.currentSlideImage = update.currentSlideImage
          if (update.currentStrokes !== undefined) next.currentStrokes = update.currentStrokes
          if (update.screenSharing !== undefined) {
            setScreenSharing(!!update.screenSharing)
            if (update.screenSharing) setViewMode('screenshare')
            else setViewMode('slide')
          }
          if ((update.currentSlide !== undefined || update.currentChapterId !== undefined) && next.session) {
            next.session = {
              ...next.session,
              ...(update.currentSlide !== undefined && { currentSlide: update.currentSlide }),
              ...(update.currentChapterId !== undefined && { currentChapterId: update.currentChapterId }),
            }
          }
          return next
        })
      } catch {}
    }
    return () => es.close()
  }, [nickname, lecture?.id])

  // Presence + camera polling for user list tab
  useEffect(() => {
    if (!nickname || !lecture?.id) return
    const fetchUsers = async () => {
      const [pRes, cRes] = await Promise.all([
        fetch(`/api/lectures/${lecture.id}/presence`),
        fetch(`/api/lectures/${lecture.id}/cameras`),
      ])
      if (pRes.ok) { const d = await pRes.json(); setPresenceList(d.participants ?? []) }
      if (cRes.ok) { const d = await cRes.json(); setCameraList(d.cameras ?? []) }
    }
    fetchUsers()
    const t = setInterval(fetchUsers, 3000)
    return () => clearInterval(t)
  }, [nickname, lecture?.id])

  // Chapter change → AI summary
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
  }, [lecture?.session?.currentChapterId, lecture?.chapters, lecture?.session])

  // ── Loading ──────────────────────────────────────────────────────────────
  if (lecture === undefined) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[#865FDF] border-t-transparent animate-spin" />
      </div>
    )
  }

  // ── Not found ────────────────────────────────────────────────────────────
  if (lecture === null) {
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

  // ── Lobby (nickname not set yet) ─────────────────────────────────────────
  if (nickname === null) {
    return (
      <div className="min-h-screen flex">
        {/* Left panel */}
        <div className="w-[420px] flex-shrink-0 bg-white flex flex-col px-10 py-10 min-h-screen">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-12">
            <div className="w-9 h-9 rounded-xl bg-[#865FDF] flex items-center justify-center">
              <GraduationCap size={18} className="text-white" />
            </div>
            <span className="font-bold text-[#111111] text-lg tracking-tight">LiveTrack</span>
          </div>

          <div className="flex-1 flex flex-col justify-center gap-7">
            {/* Nickname */}
            <div>
              <label className="block text-sm font-semibold text-[#111111] mb-2">닉네임</label>
              <input
                value={nicknameInput}
                onChange={e => setNicknameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.nativeEvent.isComposing && handleEnter()}
                placeholder="닉네임을 입력해주세요"
                className="w-full px-4 py-3.5 text-sm border-2 border-[#e5e5e5] rounded-xl outline-none focus:border-[#865FDF] transition-colors placeholder:text-[#cccccc]"
                autoFocus
              />
            </div>

            {/* Camera */}
            <div>
              <label className="block text-sm font-semibold text-[#111111] mb-2">카메라</label>
              <div className="w-full aspect-video bg-[#f0f0f0] rounded-xl overflow-hidden flex items-center justify-center relative mb-3">
                {cameraOn ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#bbbbbb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 3l18 18M11 11a3 3 0 004.243 4.243M6.757 6.757A3 3 0 0012 12" />
                      <path d="M9 3h6l2 2h3a1 1 0 011 1v11M3 8a1 1 0 011-1h1" />
                    </svg>
                  </div>
                )}
              </div>
              {/* ON / OFF toggle */}
              <div className="flex items-center gap-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="camera"
                    checked={cameraOn}
                    onChange={() => toggleCamera(true)}
                    className="accent-[#865FDF] w-4 h-4"
                  />
                  <span className="text-sm text-[#111111]">ON</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="camera"
                    checked={!cameraOn}
                    onChange={() => toggleCamera(false)}
                    className="accent-[#865FDF] w-4 h-4"
                  />
                  <span className="text-sm text-[#111111]">OFF</span>
                </label>
              </div>
            </div>
          </div>

          {/* Enter button */}
          <button
            onClick={handleEnter}
            className="w-full flex items-center justify-center gap-2 bg-[#865FDF] hover:bg-[#7450cc] active:bg-[#6340bb] text-white font-bold py-4 rounded-2xl text-base transition-colors mt-8"
          >
            강의 입장하기 <ArrowRight size={18} />
          </button>
        </div>

        {/* Right panel */}
        <div className="flex-1 bg-[#f5f5f5] flex items-center justify-center p-12">
          <div className="w-full max-w-2xl">
            {/* Slide thumbnail */}
            <div className="w-full aspect-video bg-[#0a0a0a] rounded-2xl overflow-hidden shadow-xl mb-0">
              {thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbnailUrl} alt="강의 썸네일" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#865FDF]/20 flex items-center justify-center">
                    <Sparkles size={26} className="text-[#865FDF]" />
                  </div>
                  <p className="text-[#555555] text-sm">슬라이드 미리보기 없음</p>
                </div>
              )}
            </div>

            {/* Info card */}
            <div className="bg-white rounded-b-2xl px-6 py-4 shadow-xl flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#111111] mb-0.5">{lecture.title}</h2>
                <p className="text-sm text-[#888888]">
                  {lecture.totalSlides}장 슬라이드 · {lecture.chapters.length}개 챕터
                </p>
              </div>
              {lecture.status === 'live' ? (
                <span className="inline-flex items-center gap-1.5 bg-[#22c55e] text-white text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> 진행중
                </span>
              ) : lecture.status === 'preparing' ? (
                <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0">준비 중</span>
              ) : (
                <span className="inline-flex items-center gap-1.5 bg-[#f3f3f3] text-[#aaaaaa] text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0">종료됨</span>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Ended ────────────────────────────────────────────────────────────────
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

  // ── Waiting (preparing) ───────────────────────────────────────────────────
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
          <h2 className="text-xl font-bold text-[#111111] mb-2">안녕하세요, {nickname}님.</h2>
          <p className="text-base text-[#555555] mb-1">강의 시작을 기다리고 있어요</p>
          <p className="text-sm text-[#aaaaaa]">{lecture.title}</p>
          <div className="flex items-center justify-center gap-1.5 mt-6">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-[#865FDF]/40 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Live view ─────────────────────────────────────────────────────────────
  const session = lecture.session
  const currentChapter = lecture.chapters.find(c => c.id === session?.currentChapterId)
  const unansweredCount = questions.filter(q => !q.answered).length
  const liveSlideImage = lecture.currentSlideImage ?? ''

  function handleLike(qid: string) {
    const alreadyLiked = likedIds.has(qid)
    setLikedIds(prev => {
      const next = new Set(prev)
      if (alreadyLiked) next.delete(qid)
      else next.add(qid)
      return next
    })
    setQuestions(prev => prev.map(q =>
      q.id === qid ? { ...q, likes: alreadyLiked ? Math.max(0, q.likes - 1) : q.likes + 1, likedByMe: !alreadyLiked } : q
    ))
    fetch(`/api/questions/${qid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: alreadyLiked ? 'unlike' : 'like' }),
    }).catch(console.error)
  }

  function handleSubmitQuestion(content: string, name: string) {
    if (!lecture) return
    const q: Question = {
      id: `q-student-${Date.now()}`,
      lectureId: lecture.id,
      chapterId: session?.currentChapterId ?? '',
      studentName: name,
      content,
      likes: 0,
      answered: false,
      createdAt: new Date().toISOString(),
    }
    setQuestions(prev => [q, ...prev])
    fetch(`/api/lectures/${lecture.id}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(q),
    }).catch(console.error)
  }

  return (
    <div className="flex h-screen bg-[#f8f8f8] overflow-hidden">
      {/* Camera publisher (invisible) */}
      {activeStream && nickname && (
        <StudentCamPublisher
          lectureId={lecture.id}
          nickname={nickname}
          stream={activeStream}
          mediamtxUrl={mediamtxUrl}
        />
      )}
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
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
            <span className="text-xs text-[#aaaaaa]">{session?.currentSlide}/{lecture.totalSlides} 슬라이드</span>
            <span className="text-xs text-[#aaaaaa] border-l border-[#e5e5e5] pl-3">{nickname}</span>
            <button
              onClick={() => {
                activeStream?.getTracks().forEach(t => t.stop())
                if (lecture?.id) {
                  fetch(`/api/lectures/${lecture.id}/presence`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nickname }),
                  }).catch(() => {})
                  if (activeStream) {
                    fetch(`/api/lectures/${lecture.id}/cameras`, {
                      method: 'DELETE',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ nickname }),
                    }).catch(() => {})
                  }
                }
                router.push('/')
              }}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg text-[#ef4444] border border-[#ef4444]/30 hover:bg-[#ef4444]/10 transition-colors"
            >
              <LogOut size={13} />
              나가기
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-3 relative">
          <div
            className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] relative overflow-hidden shadow-lg"
            style={{
              aspectRatio: String(viewMode === 'screenshare' ? 16 / 9 : slideRatio),
              maxHeight: 'calc(100vh - 9rem)',
              maxWidth: '100%',
              width: `min(100%, calc((100vh - 9rem) * ${viewMode === 'screenshare' ? 16 / 9 : slideRatio}))`,
            }}
          >
            {/* Slide content */}
            {viewMode === 'slide' && (liveSlideImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={liveSlideImage}
                alt={`슬라이드 ${session?.currentSlide}`}
                className="absolute inset-0 w-full h-full object-contain"
                onLoad={e => {
                  const img = e.currentTarget
                  if (img.naturalWidth && img.naturalHeight) {
                    setSlideRatio(img.naturalWidth / img.naturalHeight)
                  }
                }}
              />
            ) : (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-[#865FDF]/5 to-transparent" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Sparkles size={32} className="text-[#865FDF]/30 mb-4" />
                  <p className="text-[#555555] text-sm">강의 화면이 여기에 표시됩니다</p>
                </div>
              </>
            ))}
            <StrokeOverlay lectureId={lecture.id} externalStrokeData={lecture.currentStrokes} />
            <ScreenShareViewer lectureId={lecture.id} mediamtxUrl={mediamtxUrl} active={screenSharing && viewMode === 'screenshare'} />
            {/* Self-view PiP */}
            {activeStream && (
              <div className="absolute bottom-4 right-4 z-30 w-28 aspect-video rounded-xl overflow-hidden shadow-lg border-2 border-white/20 bg-black">
                <video
                  ref={el => { if (el && activeStream) { el.srcObject = activeStream; el.play().catch(() => {}) } }}
                  autoPlay muted playsInline
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              </div>
            )}
            {session && viewMode === 'slide' && (
              <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/60 rounded-lg px-3 py-1.5" style={{ zIndex: 20 }}>
                <div className="w-1.5 h-1.5 rounded-full bg-[#865FDF]" />
                <span className="text-white text-xs">슬라이드 {session.currentSlide} · {currentChapter?.title}</span>
              </div>
            )}
          </div>

          {/* View toggle — only when screen sharing */}
          {screenSharing && (
            <div className="flex gap-2 bg-white border border-[#e5e5e5] rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setViewMode('slide')}
                title="슬라이드"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                  ${viewMode === 'slide' ? 'bg-[#865FDF] text-white' : 'text-[#aaaaaa] hover:text-[#555555]'}`}
              >
                <GalleryHorizontalEnd size={14} /> 슬라이드
              </button>
              <button
                onClick={() => setViewMode('screenshare')}
                title="화면공유"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                  ${viewMode === 'screenshare' ? 'bg-[#865FDF] text-white' : 'text-[#aaaaaa] hover:text-[#555555]'}`}
              >
                <Monitor size={14} /> 화면공유
              </button>
            </div>
          )}

          {showSummary && (
            <div className="absolute bottom-8 left-8 z-20">
              <AISummaryCard chapterTitle={summaryData.chapter} summary={summaryData.text} onClose={() => setShowSummary(false)} />
            </div>
          )}
        </div>
      </div>

      {/* Toggle button */}
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
              { key: 'users' as const, label: '유저', icon: Users },
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
            ) : tab === 'qa' ? (
              <QAPanel
                questions={questions}
                mode="student"
                lectureId={lecture.id}
                currentChapterId={session?.currentChapterId}
                onLike={handleLike}
                onSubmit={handleSubmitQuestion}
                userName={nickname}
              />
            ) : (
              <div className="flex-1 overflow-y-auto px-3 py-3">
                <p className="text-xs text-[#aaaaaa] px-2 mb-2">{presenceList.length}명 참여중</p>
                {presenceList.map(name => {
                  const hasCam = cameraList.some(c => c.nickname === name)
                  const isMe = name === nickname
                  return (
                    <div key={name} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#f8f8f8]">
                      <div className="w-8 h-8 rounded-full bg-[#865FDF]/15 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-[#865FDF]">{name[0]}</span>
                      </div>
                      <span className="text-sm text-[#111111] flex-1">{name}{isMe ? ' (나)' : ''}</span>
                      {hasCam ? <Video size={14} className="text-[#865FDF]" /> : <VideoOff size={14} className="text-[#cccccc]" />}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
