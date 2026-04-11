'use client'

import React, { useState, useEffect } from 'react'
import { CheckCircle, Circle, PlayCircle, Clock } from 'lucide-react'
import type { Chapter } from '@/lib/types'
import { Progress } from '@/components/ui/progress'

interface ChapterPanelProps {
  chapters: Chapter[]
  currentChapterId: string
  currentSlide: number
  totalSlides: number
  mode?: 'lecturer' | 'student'
  startedAt?: string   // ISO string — for elapsed time in student mode
}

function useElapsed(startedAt?: string) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!startedAt) return
    function tick() {
      setElapsed(Math.floor((Date.now() - new Date(startedAt!).getTime()) / 1000))
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [startedAt])

  return elapsed
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function ChapterPanel({ chapters, currentChapterId, currentSlide, totalSlides, mode = 'student', startedAt }: ChapterPanelProps) {
  const progress = Math.round((currentSlide / totalSlides) * 100)
  const completedCount = chapters.filter(c => c.status === 'completed').length
  const elapsed = useElapsed(startedAt)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  function toggleSummary(id: string) {
    setExpandedId(prev => prev === id ? null : id)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#e5e5e5]">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#aaaaaa] mb-3">강의 진행</p>
        <Progress value={progress} showLabel />
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-[#aaaaaa]">{completedCount}/{chapters.length} 챕터 완료</p>
          {startedAt && (
            <div className="flex items-center gap-1 text-xs text-[#865FDF]">
              <Clock size={11} />
              <span className="font-mono">경과 {formatElapsed(elapsed)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Chapter list */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {chapters.map((ch, idx) => {
          const isActive = ch.id === currentChapterId
          const isDone = ch.status === 'completed'
          const isExpanded = expandedId === ch.id
          const clickable = mode === 'student' && (isActive || isDone)

          return (
            <div key={ch.id} className="mb-1">
              <div
                className={`relative flex items-start gap-3 px-3 py-3 rounded-xl transition-all
                  ${isActive ? 'bg-[#f0ebff] border border-[#865FDF]/20' : ''}
                  ${isDone ? 'opacity-60' : ''}
                  ${clickable ? 'cursor-pointer hover:bg-[#f8f6ff]' : ''}
                `}
                onClick={() => clickable && toggleSummary(ch.id)}
              >
                {isActive && (
                  <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-[#865FDF] rounded-full" />
                )}

                <div className="flex-shrink-0 mt-0.5">
                  {isDone ? (
                    <CheckCircle size={18} className="text-[#22c55e]" />
                  ) : isActive ? (
                    <PlayCircle size={18} className="text-[#865FDF]" />
                  ) : (
                    <Circle size={18} className="text-[#cccccc]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium leading-tight ${isActive ? 'text-[#865FDF]' : isDone ? 'text-[#555555]' : 'text-[#aaaaaa]'}`}>
                    {ch.title}
                  </p>
                  <p className="text-xs text-[#aaaaaa] mt-0.5">슬라이드 {ch.slideRange[0]}–{ch.slideRange[1]}장</p>
                  {isActive && ch.summary && !isExpanded && (
                    <p className="text-xs text-[#865FDF]/70 mt-1.5 line-clamp-2">{ch.summary}</p>
                  )}
                  {isDone && ch.durationMinutes && (
                    <p className="text-xs text-[#aaaaaa] mt-0.5">{ch.durationMinutes}분 소요</p>
                  )}
                </div>

                <span className="text-[10px] font-semibold text-[#cccccc] flex-shrink-0 mt-0.5">
                  {String(idx + 1).padStart(2, '0')}
                </span>
              </div>

              {/* Summary popover for student */}
              {isExpanded && (
                <div className="mx-3 mb-2 px-3 py-2.5 bg-[#f8f6ff] border border-[#865FDF]/15 rounded-xl">
                  <p className="text-[10px] font-semibold text-[#865FDF] uppercase tracking-wide mb-1.5">챕터 요약</p>
                  <p className="text-xs text-[#333333] leading-relaxed">
                    {ch.summary ?? '요약 없음'}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
