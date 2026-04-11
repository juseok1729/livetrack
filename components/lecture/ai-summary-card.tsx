'use client'

import React, { useEffect } from 'react'
import { Sparkles, X } from 'lucide-react'

interface AISummaryCardProps {
  chapterTitle: string
  summary: string
  onClose: () => void
  autoCloseMs?: number
}

export function AISummaryCard({ chapterTitle, summary, onClose, autoCloseMs = 8000 }: AISummaryCardProps) {
  useEffect(() => {
    const t = setTimeout(onClose, autoCloseMs)
    return () => clearTimeout(t)
  }, [onClose, autoCloseMs])

  return (
    <div className="animate-slide-up pointer-events-auto">
      <div className="relative bg-gradient-to-br from-[#865FDF] to-[#6b47c4] text-white rounded-2xl p-5 shadow-xl max-w-sm">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X size={14} />
        </button>

        {/* Icon + label */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
            <Sparkles size={13} />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider opacity-80">AI 챕터 요약</span>
        </div>

        {/* Chapter title */}
        <p className="text-xs opacity-70 mb-1 font-medium">{chapterTitle}</p>

        {/* Summary */}
        <p className="text-sm leading-relaxed font-medium">{summary}</p>

        {/* Auto-close bar */}
        <div className="mt-4 h-0.5 rounded-full bg-white/20 overflow-hidden">
          <div
            className="h-full bg-white/60 rounded-full"
            style={{
              animation: `shrink ${autoCloseMs}ms linear forwards`,
            }}
          />
        </div>
        <style>{`
          @keyframes shrink {
            from { width: 100%; }
            to { width: 0%; }
          }
        `}</style>
      </div>
    </div>
  )
}
