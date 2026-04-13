'use client'

import { use, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Play, ArrowLeft, Pencil, Check, X, FileText, FolderOpen } from 'lucide-react'
import Link from 'next/link'
import { AppLayout } from '@/components/layout/app-layout'
import { ChapterEditor } from '@/components/lecture/chapter-editor'
import { FileUploadZone } from '@/components/lecture/file-upload-zone'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useLecture } from '@/contexts/lecture-context'
import { useAuth } from '@/contexts/auth-context'
import type { Chapter } from '@/lib/types'
import { extractPdfPages } from '@/lib/pdf-parser'
import { renderPptxSlides } from '@/lib/pptx-renderer'
import { setSlides } from '@/lib/slide-store'
import type { AnalyzePdfResponse } from '@/app/api/analyze-pdf/route'

export default function PreparePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { state, dispatch } = useLecture()
  const lecture = state.lectures.find(l => l.id === id)

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'lecturer')) {
      router.replace(`/auth/login?redirect=/lecturer/prepare/${id}`)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user])

  const [chapters, setChapters] = useState<Chapter[]>(lecture?.chapters ?? [])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiStep, setAiStep] = useState<'parsing' | 'analyzing' | ''>('')
  const [aiDone, setAiDone] = useState(false)
  const [aiError, setAiError] = useState('')
  const [fileName, setFileName] = useState('')
  const [totalPages, setTotalPages] = useState(0)
  const [suggestedTitle, setSuggestedTitle] = useState('')
  const [slideImages, setSlideImages] = useState<string[]>([])

  // Title inline edit state
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(lecture?.title ?? '')
  const titleInputRef = useRef<HTMLInputElement>(null)
  const changeFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (lecture) {
      setChapters(lecture.chapters)
      setTitleValue(lecture.title)
    }
  }, [lecture?.id])

  useEffect(() => {
    if (editingTitle) titleInputRef.current?.select()
  }, [editingTitle])

  function commitTitle(value: string) {
    const trimmed = value.trim()
    if (trimmed) {
      dispatch({ type: 'UPDATE_TITLE', lectureId: id, title: trimmed })
      setTitleValue(trimmed)
    } else {
      setTitleValue(lecture?.title ?? '')
    }
    setEditingTitle(false)
    setSuggestedTitle('')
  }

  function acceptSuggested() {
    commitTitle(suggestedTitle)
  }

  async function handleFileSelected(file: File) {
    setFileName(file.name)
    setAiLoading(true)
    setAiDone(false)
    setAiError('')
    setAiStep('parsing')

    try {
      // Step 1: Extract text + render slide images client-side
      const isPptx = file.name.toLowerCase().endsWith('.pptx')
      let pages: { pageNumber: number; text: string }[]

      if (isPptx) {
        const result = await renderPptxSlides(file)
        pages = result.pages
        setTotalPages(result.pages.length)
        setSlideImages(result.images)
        setSlides(id, result.images, result.ratios)
        fetch(`/api/lectures/${id}/slides`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images: result.images, ratios: result.ratios }),
        }).catch(() => {})
      } else {
        const { pages: pdfPages, images, ratios } = await extractPdfPages(file)
        pages = pdfPages
        setTotalPages(pdfPages.length)
        setSlideImages(images)
        setSlides(id, images, ratios)
        fetch(`/api/lectures/${id}/slides`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images, ratios }),
        }).catch(() => {})
      }

      // Always sync totalSlides to the actual page count
      dispatch({ type: 'UPDATE_TOTAL_SLIDES', lectureId: id, totalSlides: pages.length })

      // Step 2: Send to OpenAI via API route
      setAiStep('analyzing')
      const res = await fetch('/api/analyze-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pages, fileName: file.name }),
      })

      if (!res.ok) throw new Error('API 분석 실패')

      const result: AnalyzePdfResponse = await res.json()

      // Step 3: Apply results
      const newChapters: Chapter[] = result.chapters.map((c, i) => ({
        id: `ch-ai-${Date.now()}-${i}`,
        title: c.title,
        slideRange: c.slideRange,
        order: i + 1,
        status: 'pending' as const,
        summary: c.summary,
      }))

      setChapters(newChapters)
      setSuggestedTitle(result.title)
      setAiDone(true)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'PDF 분석 중 오류가 발생했습니다')
    } finally {
      setAiLoading(false)
      setAiStep('')
    }
  }

  function handleSave() {
    if (!lecture) return
    dispatch({ type: 'UPDATE_CHAPTERS', lectureId: id, chapters })
  }

  function handleStartLecture() {
    handleSave()
    dispatch({ type: 'START_LECTURE', lectureId: id })
    router.push(`/lecturer/live/${id}`)
  }

  if (authLoading || !user) return null

  if (!lecture) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-[#aaaaaa]">강의를 찾을 수 없습니다</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <Link href="/lecturer" className="p-2 rounded-lg hover:bg-[#f3f3f3] text-[#555555] transition-colors mt-1">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          {/* Inline title editor */}
          {editingTitle ? (
            <div className="flex items-center gap-2 mb-1">
              <input
                ref={titleInputRef}
                value={titleValue}
                onChange={e => setTitleValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitTitle(titleValue)
                  if (e.key === 'Escape') { setTitleValue(lecture.title); setEditingTitle(false) }
                }}
                className="text-2xl font-bold text-[#111111] bg-transparent border-b-2 border-[#865FDF] outline-none w-full min-w-0"
                autoFocus
              />
              <button onClick={() => commitTitle(titleValue)} className="p-1.5 rounded-lg bg-[#865FDF] text-white hover:bg-[#7450cc] transition-colors flex-shrink-0">
                <Check size={15} />
              </button>
              <button onClick={() => { setTitleValue(lecture.title); setEditingTitle(false) }} className="p-1.5 rounded-lg hover:bg-[#f3f3f3] text-[#aaaaaa] transition-colors flex-shrink-0">
                <X size={15} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group mb-1">
              <h1 className="text-2xl font-bold text-[#111111] truncate">{lecture.title}</h1>
              <button
                onClick={() => { setTitleValue(lecture.title); setEditingTitle(true) }}
                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-[#f3f3f3] text-[#aaaaaa] hover:text-[#555555] transition-all flex-shrink-0"
              >
                <Pencil size={14} />
              </button>
            </div>
          )}

          {/* AI title suggestion banner */}
          {suggestedTitle && !editingTitle && (
            <div className="flex items-center gap-2 mt-1 animate-fade-in">
              <Sparkles size={12} className="text-[#865FDF] flex-shrink-0" />
              <span className="text-xs text-[#555555]">AI 추천 제목:</span>
              <span className="text-xs font-semibold text-[#865FDF]">"{suggestedTitle}"</span>
              <button
                onClick={acceptSuggested}
                className="text-xs text-[#865FDF] hover:text-[#7450cc] underline underline-offset-2 transition-colors"
              >
                적용
              </button>
              <button
                onClick={() => setSuggestedTitle('')}
                className="text-[#cccccc] hover:text-[#aaaaaa] transition-colors"
              >
                <X size={11} />
              </button>
            </div>
          )}

          <p className="text-sm text-[#555555] mt-0.5">강의 준비 · 챕터를 구성하고 강의를 시작하세요</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Button variant="outline" onClick={handleSave}>저장</Button>
          <Button onClick={handleStartLecture}>
            <Play size={15} /> 강의 시작
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Left: Upload */}
        <div className="col-span-2 flex flex-col gap-4">
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-[#111111] mb-1">강의 자료 업로드</h2>
            <p className="text-xs text-[#555555] mb-4">PPT 또는 PDF를 업로드하면 AI가 챕터를 자동으로 제안합니다</p>
            {fileName && !aiLoading ? (
              <div className="flex items-center gap-3 p-4 bg-[#f8f8f8] border border-[#e5e5e5] rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-[#f0ebff] flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-[#865FDF]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#111111] truncate">{fileName}</p>
                  <p className="text-xs text-[#aaaaaa] mt-0.5">{totalPages}장 슬라이드</p>
                </div>
                <button
                  onClick={() => changeFileRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs text-[#888888] hover:text-[#865FDF] px-2.5 py-1.5 rounded-lg hover:bg-[#f0ebff] transition-colors flex-shrink-0"
                >
                  <FolderOpen size={13} /> 파일 변경
                </button>
                <input
                  ref={changeFileRef}
                  type="file"
                  accept=".pdf,.pptx"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) handleFileSelected(file)
                    e.target.value = ''
                  }}
                />
              </div>
            ) : (
              <FileUploadZone onFileSelected={handleFileSelected} disabled={aiLoading} />
            )}
          </div>

          {/* AI Status */}
          {aiLoading && (
            <div className="bg-[#f0ebff] border border-[#865FDF]/20 rounded-2xl p-5 animate-fade-in">
              <div className="flex items-center gap-3 mb-3">
                <Spinner size={18} />
                <span className="text-sm font-medium text-[#865FDF]">
                  {aiStep === 'parsing' ? 'PDF 슬라이드 파싱 중...' : 'AI가 챕터를 분석 중...'}
                </span>
              </div>
              <p className="text-xs text-[#865FDF]/70">{fileName}{totalPages > 0 ? ` · ${totalPages}장` : ''}</p>
              <div className="mt-3 flex gap-1">
                {[
                  { label: '슬라이드 파싱', active: aiStep === 'parsing' },
                  { label: 'AI 분석', active: aiStep === 'analyzing' },
                  { label: '챕터 구성', active: false },
                ].map(({ label, active }, i) => (
                  <span key={label} className={`text-[10px] px-2 py-0.5 rounded-full transition-all ${active ? 'bg-[#865FDF] text-white animate-pulse-soft' : 'bg-[#865FDF]/10 text-[#865FDF]'}`} style={{ animationDelay: `${i * 0.3}s` }}>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {aiError && !aiLoading && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 animate-fade-in">
              <p className="text-sm font-medium text-red-600 mb-1">분석 실패</p>
              <p className="text-xs text-red-400">{aiError}</p>
            </div>
          )}

          {aiDone && !aiLoading && (
            <div className="bg-[#f0ebff] border border-[#865FDF]/20 rounded-2xl p-5 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-[#865FDF]" />
                <span className="text-sm font-semibold text-[#865FDF]">AI 챕터 생성 완료</span>
              </div>
              <p className="text-xs text-[#865FDF]/70">{chapters.length}개 챕터가 자동으로 구성되었습니다. 아래에서 편집하세요.</p>
            </div>
          )}

          {/* Guide */}
          <div className="bg-[#f8f8f8] border border-[#e5e5e5] rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-[#555555] mb-3">챕터 편집 방법</h3>
            <ul className="text-xs text-[#aaaaaa] space-y-2">
              <li className="flex items-start gap-2"><span className="text-[#865FDF] mt-0.5">•</span>챕터를 드래그해서 순서를 변경할 수 있습니다</li>
              <li className="flex items-start gap-2"><span className="text-[#865FDF] mt-0.5">•</span>챕터명을 클릭해서 편집할 수 있습니다</li>
              <li className="flex items-start gap-2"><span className="text-[#865FDF] mt-0.5">•</span>여러 챕터를 선택하면 병합이 가능합니다</li>
              <li className="flex items-start gap-2"><span className="text-[#865FDF] mt-0.5">•</span>챕터 추가 버튼으로 직접 추가할 수 있습니다</li>
            </ul>
          </div>
        </div>

        {/* Right: Chapter Editor */}
        <div className="col-span-3">
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-[#111111]">챕터 구성</h2>
                <p className="text-xs text-[#aaaaaa] mt-0.5">{chapters.length}개 챕터 · {lecture.totalSlides}장 슬라이드</p>
              </div>
              {chapters.length === 0 && (
                <span className="text-xs text-[#aaaaaa]">좌측에서 PDF 업로드</span>
              )}
            </div>

            {chapters.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#f3f3f3] flex items-center justify-center">
                  <Sparkles size={22} className="text-[#cccccc]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#555555]">아직 챕터가 없습니다</p>
                  <p className="text-xs text-[#aaaaaa] mt-1">좌측에서 파일을 업로드하거나 AI 생성을 눌러보세요</p>
                </div>
              </div>
            ) : (
              <ChapterEditor chapters={chapters} onChange={setChapters} slides={slideImages} />
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
