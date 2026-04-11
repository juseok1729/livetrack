'use client'

import React, { useState, useRef } from 'react'
import { Upload, FileText } from 'lucide-react'

interface FileUploadZoneProps {
  onFileSelected: (file: File) => void
  disabled?: boolean
}

type ZoneState = 'idle' | 'dragging'

export function FileUploadZone({ onFileSelected, disabled }: FileUploadZoneProps) {
  const [state, setState] = useState<ZoneState>('idle')
  const [sizeError, setSizeError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const MAX_BYTES = 100 * 1024 * 1024 // 100 MB

  function handleFile(file: File) {
    if (disabled) return
    if (file.size > MAX_BYTES) {
      setSizeError('파일 크기가 100MB를 초과합니다.')
      return
    }
    setSizeError('')
    onFileSelected(file)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setState('idle')
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 p-10 border-2 border-dashed rounded-xl transition-all
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${state === 'dragging'
          ? 'border-[#865FDF] bg-[#f0ebff]'
          : 'border-[#e5e5e5] bg-white hover:border-[#865FDF] hover:bg-[#fafaff]'
        }`}
      onDragOver={e => { e.preventDefault(); if (!disabled) setState('dragging') }}
      onDragLeave={() => setState('idle')}
      onDrop={onDrop}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <div className="w-12 h-12 rounded-xl bg-[#f0ebff] flex items-center justify-center">
        <Upload size={22} className="text-[#865FDF]" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-[#111111]">파일을 드래그하거나 클릭해서 업로드</p>
        <p className="text-xs text-[#555555] mt-1">.pdf, .pptx 지원 · 최대 100MB</p>
      </div>
      <div className="flex items-center gap-4 text-xs text-[#aaaaaa]">
        <span className="flex items-center gap-1"><FileText size={12} /> PDF</span>
        <span className="flex items-center gap-1"><FileText size={12} /> PPTX</span>
      </div>
      <input ref={inputRef} type="file" accept=".pdf,.pptx" className="hidden" onChange={onInputChange} />
      {sizeError && (
        <p className="text-xs text-[#ef4444] bg-red-50 px-3 py-1.5 rounded-lg w-full text-center">{sizeError}</p>
      )}
    </div>
  )
}
