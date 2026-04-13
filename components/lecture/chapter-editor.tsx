'use client'

import React, { useState } from 'react'
import { GripVertical, Pencil, Trash2, Plus, Check, X, Merge } from 'lucide-react'
import type { Chapter } from '@/lib/types'
import { Button } from '@/components/ui/button'

interface ChapterEditorProps {
  chapters: Chapter[]
  onChange: (chapters: Chapter[]) => void
  slides?: string[]
}

export function ChapterEditor({ chapters, onChange, slides }: ChapterEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  function startEdit(ch: Chapter) {
    setEditingId(ch.id)
    setEditValue(ch.title)
  }

  function saveEdit(id: string) {
    onChange(chapters.map(c => c.id === id ? { ...c, title: editValue } : c))
    setEditingId(null)
  }

  function deleteChapter(id: string) {
    onChange(chapters.filter(c => c.id !== id).map((c, i) => ({ ...c, order: i + 1 })))
  }

  function addChapter() {
    const last = chapters[chapters.length - 1]
    const newCh: Chapter = {
      id: `ch-new-${Date.now()}`,
      title: '새 챕터',
      slideRange: last ? [last.slideRange[1] + 1, last.slideRange[1] + 5] : [1, 5],
      order: chapters.length + 1,
      status: 'pending',
    }
    onChange([...chapters, newCh])
    setTimeout(() => startEdit(newCh), 50)
  }

  function mergeSelected() {
    if (selected.size < 2) return
    const sel = chapters.filter(c => selected.has(c.id)).sort((a, b) => a.order - b.order)
    const merged: Chapter = {
      ...sel[0],
      title: sel.map(c => c.title).join(' + '),
      slideRange: [sel[0].slideRange[0], sel[sel.length - 1].slideRange[1]],
    }
    const rest = chapters.filter(c => !selected.has(c.id) || c.id === sel[0].id)
    onChange(rest.map(c => c.id === sel[0].id ? merged : c).map((c, i) => ({ ...c, order: i + 1 })))
    setSelected(new Set())
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  // Drag and drop
  function onDragStart(id: string) { setDragId(id) }
  function onDragEnd() { setDragId(null); setDragOver(null) }
  function onDragOver(e: React.DragEvent, id: string) { e.preventDefault(); setDragOver(id) }
  function onDrop(targetId: string) {
    if (!dragId || dragId === targetId) return
    const from = chapters.findIndex(c => c.id === dragId)
    const to = chapters.findIndex(c => c.id === targetId)
    const reordered = [...chapters]
    const [moved] = reordered.splice(from, 1)
    reordered.splice(to, 0, moved)
    onChange(reordered.map((c, i) => ({ ...c, order: i + 1 })))
    setDragOver(null)
    setDragId(null)
  }

  return (
    <div className="flex flex-col gap-2">
      {selected.size >= 2 && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#f0ebff] rounded-xl border border-[#865FDF]/20 animate-fade-in">
          <span className="text-sm text-[#865FDF] font-medium">{selected.size}개 챕터 선택됨</span>
          <Button variant="secondary" size="sm" onClick={mergeSelected}>
            <Merge size={13} /> 병합
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>취소</Button>
        </div>
      )}

      {chapters.map((ch, idx) => (
        <div
          key={ch.id}
          draggable
          onDragStart={() => onDragStart(ch.id)}
          onDragEnd={onDragEnd}
          onDragOver={e => onDragOver(e, ch.id)}
          onDrop={() => onDrop(ch.id)}
          className={`flex items-center gap-3 px-4 py-3.5 bg-white border rounded-xl transition-all group
            ${dragOver === ch.id ? 'border-[#865FDF] shadow-md' : 'border-[#e5e5e5]'}
            ${selected.has(ch.id) ? 'border-[#865FDF] bg-[#fafaff]' : ''}
            ${dragId === ch.id ? 'opacity-40' : 'opacity-100'}
          `}
        >
          {/* Drag handle */}
          <div className="cursor-grab text-[#cccccc] hover:text-[#aaaaaa] flex-shrink-0">
            <GripVertical size={16} />
          </div>

          {/* Order + select */}
          <button
            className={`w-6 h-6 rounded-full border text-xs font-medium flex-shrink-0 transition-colors
              ${selected.has(ch.id)
                ? 'bg-[#865FDF] border-[#865FDF] text-white'
                : 'border-[#e5e5e5] text-[#aaaaaa] hover:border-[#865FDF] hover:text-[#865FDF]'
              }`}
            onClick={() => toggleSelect(ch.id)}
          >
            {selected.has(ch.id) ? <Check size={11} className="m-auto" /> : idx + 1}
          </button>

          {/* Title */}
          <div className="flex-1 min-w-0">
            {editingId === ch.id ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(ch.id); if (e.key === 'Escape') setEditingId(null) }}
                  className="flex-1 text-sm px-2 py-1 border border-[#865FDF] rounded-md outline-none"
                />
                <button onClick={() => saveEdit(ch.id)} className="text-[#865FDF] hover:text-[#7450cc]"><Check size={15} /></button>
                <button onClick={() => setEditingId(null)} className="text-[#aaaaaa] hover:text-[#555555]"><X size={15} /></button>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-[#111111] truncate">{ch.title}</p>
                <p className="text-xs text-[#aaaaaa]">슬라이드 {ch.slideRange[0]}–{ch.slideRange[1]}장</p>
              </div>
            )}
          </div>

          {/* Slide thumbnails */}
          {slides && slides.length > 0 && editingId !== ch.id && (() => {
            const start = ch.slideRange[0] - 1
            const end = Math.min(ch.slideRange[1] - 1, slides.length - 1)
            const thumbs = []
            for (let i = start; i <= end; i++) thumbs.push(i)
            const visible = thumbs.slice(0, 4)
            const overflow = thumbs.length - visible.length
            return (
              <div className="flex items-center gap-1 flex-shrink-0">
                {visible.map(i => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={slides[i]}
                    alt={`슬라이드 ${i + 1}`}
                    className="w-10 h-7 object-cover rounded border border-[#e5e5e5] flex-shrink-0"
                  />
                ))}
                {overflow > 0 && (
                  <div className="w-10 h-7 rounded border border-[#e5e5e5] bg-[#f3f3f3] flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] text-[#aaaaaa] font-medium">+{overflow}</span>
                  </div>
                )}
              </div>
            )
          })()}

          {/* Actions */}
          {editingId !== ch.id && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => startEdit(ch)}
                className="p-1.5 rounded-md hover:bg-[#f3f3f3] text-[#aaaaaa] hover:text-[#555555] transition-colors"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => deleteChapter(ch.id)}
                className="p-1.5 rounded-md hover:bg-red-50 text-[#aaaaaa] hover:text-[#ef4444] transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      ))}

      <button
        onClick={addChapter}
        className="flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-[#e5e5e5] rounded-xl text-sm text-[#aaaaaa] hover:text-[#865FDF] hover:border-[#865FDF] transition-colors"
      >
        <Plus size={15} /> 챕터 추가
      </button>
    </div>
  )
}
