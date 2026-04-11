'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { Pen, Highlighter, Eraser, Trash2, Undo2, X } from 'lucide-react'

type Tool = 'pen' | 'highlighter' | 'eraser'

interface Point { x: number; y: number }
interface Stroke {
  tool: Tool
  color: string
  width: number
  opacity: number
  points: Point[]
}

const PEN_COLORS = ['#111111', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#865FDF', '#ffffff']
const HIGHLIGHTER_COLORS = ['#fde047', '#86efac', '#93c5fd', '#f9a8d4', '#c4b5fd']

interface SlideAnnotatorProps {
  onClose: () => void
  lectureId?: string
}

// Write strokes to localStorage so the student tab can mirror them.
// Points are normalized to 0–1 so they scale to any canvas size.
function syncStrokes(lectureId: string, strokes: Stroke[], canvas: HTMLCanvasElement) {
  const { width, height } = canvas
  if (!width || !height) return
  const normalized = strokes
    .filter(s => s?.points?.length >= 2)
    .map(s => ({
      ...s,
      points: s.points.map(p => ({ x: p.x / width, y: p.y / height })),
    }))
  try {
    localStorage.setItem(`eduflow-strokes-${lectureId}`, JSON.stringify({ width, height, strokes: normalized }))
  } catch { /* ignore quota */ }
}

export function SlideAnnotator({ onClose, lectureId }: SlideAnnotatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<Tool>('pen')
  const [color, setColor] = useState('#111111')
  const [isDrawing, setIsDrawing] = useState(false)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const currentStroke = useRef<Stroke | null>(null)

  // Tool settings
  const toolConfig: Record<Tool, { width: number; opacity: number }> = {
    pen:         { width: 2.5,  opacity: 1 },
    highlighter: { width: 18,   opacity: 0.35 },
    eraser:      { width: 24,   opacity: 1 },
  }

  // Re-render all strokes onto the canvas
  const redraw = useCallback((strokeList: Stroke[]) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (const stroke of strokeList) {
      if (!stroke || !stroke.points || stroke.points.length < 2) continue
      ctx.save()
      ctx.globalAlpha = stroke.opacity
      ctx.strokeStyle = stroke.tool === 'eraser' ? 'rgba(0,0,0,1)' : stroke.color
      ctx.lineWidth = stroke.width
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out'
      } else if (stroke.tool === 'highlighter') {
        ctx.globalCompositeOperation = 'multiply'
      } else {
        ctx.globalCompositeOperation = 'source-over'
      }

      ctx.beginPath()
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      for (let i = 1; i < stroke.points.length; i++) {
        const prev = stroke.points[i - 1]
        const curr = stroke.points[i]
        // Smooth curve via midpoint
        const mx = (prev.x + curr.x) / 2
        const my = (prev.y + curr.y) / 2
        ctx.quadraticCurveTo(prev.x, prev.y, mx, my)
      }
      ctx.stroke()
      ctx.restore()
    }
  }, [])

  useEffect(() => {
    redraw(strokes)
    if (lectureId && canvasRef.current) syncStrokes(lectureId, strokes, canvasRef.current)
  }, [strokes, redraw, lectureId])

  // Fit canvas to its displayed size
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const observer = new ResizeObserver(() => {
      const { width, height } = canvas.getBoundingClientRect()
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
        redraw(strokes)
      }
    })
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [strokes, redraw])

  function getPos(e: React.PointerEvent<HTMLCanvasElement>): Point {
    const rect = canvasRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    const cfg = toolConfig[tool]
    currentStroke.current = {
      tool,
      color,
      width: cfg.width,
      opacity: cfg.opacity,
      points: [getPos(e)],
    }
    setIsDrawing(true)
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing || !currentStroke.current) return
    currentStroke.current.points.push(getPos(e))

    // Live preview: redraw committed + current (filter out any nulls defensively)
    const live = [...strokes, currentStroke.current].filter((s): s is Stroke => s !== null)
    redraw(live)
  }

  function onPointerUp() {
    if (!isDrawing || !currentStroke.current) return
    if (currentStroke.current.points.length >= 2) {
      setStrokes(prev => [...prev, currentStroke.current!])
    }
    currentStroke.current = null
    setIsDrawing(false)
  }

  function undo() {
    setStrokes(prev => prev.slice(0, -1))
  }

  function clear() {
    setStrokes([])
  }

  // Cursor style
  const cursorMap: Record<Tool, string> = {
    pen: 'crosshair',
    highlighter: 'cell',
    eraser: 'cell',
  }

  const activeColor = tool === 'highlighter'
    ? (HIGHLIGHTER_COLORS.includes(color) ? color : HIGHLIGHTER_COLORS[0])
    : (PEN_COLORS.includes(color) ? color : PEN_COLORS[0])

  return (
    <>
      {/* Canvas overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-10 rounded-2xl"
        style={{ cursor: cursorMap[tool], touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      />

      {/* Toolbar */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-white/95 backdrop-blur border border-[#e5e5e5] rounded-2xl px-3 py-2 shadow-lg animate-slide-up">
        {/* Tools */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-[#e5e5e5]">
          {([
            { key: 'pen' as const, icon: Pen, label: '펜' },
            { key: 'highlighter' as const, icon: Highlighter, label: '형광펜' },
            { key: 'eraser' as const, icon: Eraser, label: '지우개' },
          ]).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              title={label}
              onClick={() => {
                setTool(key)
                // Switch to appropriate default color
                if (key === 'highlighter') setColor(HIGHLIGHTER_COLORS[0])
                else if (key !== 'eraser') setColor(PEN_COLORS[0])
              }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                tool === key
                  ? 'bg-[#865FDF] text-white'
                  : 'text-[#555555] hover:bg-[#f3f3f3]'
              }`}
            >
              <Icon size={15} />
            </button>
          ))}
        </div>

        {/* Color swatches */}
        {tool !== 'eraser' && (
          <div className="flex items-center gap-1 px-2 border-r border-[#e5e5e5]">
            {(tool === 'highlighter' ? HIGHLIGHTER_COLORS : PEN_COLORS).map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                title={c}
                className={`w-5 h-5 rounded-full border-2 transition-transform ${
                  activeColor === c ? 'border-[#865FDF] scale-125' : 'border-transparent hover:scale-110'
                }`}
                style={{ background: c, boxShadow: c === '#ffffff' ? 'inset 0 0 0 1px #e5e5e5' : undefined }}
              />
            ))}
          </div>
        )}

        {/* Stroke width preview */}
        {tool !== 'eraser' && (
          <div className="w-12 flex items-center justify-center px-2 border-r border-[#e5e5e5]">
            <div
              className="rounded-full"
              style={{
                width: Math.min(toolConfig[tool].width * 2, 40),
                height: Math.min(toolConfig[tool].width * 0.8, 10),
                background: tool === 'highlighter' ? color : color,
                opacity: tool === 'highlighter' ? 0.5 : 1,
              }}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-0.5 pl-1">
          <button
            title="실행 취소"
            onClick={undo}
            disabled={strokes.length === 0}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#555555] hover:bg-[#f3f3f3] disabled:opacity-30 transition-colors"
          >
            <Undo2 size={15} />
          </button>
          <button
            title="전체 지우기"
            onClick={clear}
            disabled={strokes.length === 0}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#555555] hover:bg-red-50 hover:text-[#ef4444] disabled:opacity-30 transition-colors"
          >
            <Trash2 size={15} />
          </button>
          <button
            title="닫기"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#aaaaaa] hover:bg-[#f3f3f3] hover:text-[#555555] transition-colors ml-1"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </>
  )
}
