'use client'

import { useEffect, useRef, useCallback } from 'react'

interface Point { x: number; y: number }
interface NormalizedStroke {
  tool: 'pen' | 'highlighter' | 'eraser'
  color: string
  width: number
  opacity: number
  points: Point[] // normalized 0–1
}
interface StrokeData {
  width: number
  height: number
  strokes: NormalizedStroke[]
}

interface StrokeOverlayProps {
  lectureId: string
}

export function StrokeOverlay({ lectureId }: StrokeOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dataRef = useRef<StrokeData | null>(null)

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    const data = dataRef.current
    if (!canvas || !data) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const scaleX = canvas.width / data.width
    const scaleY = canvas.height / data.height

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (const stroke of data.strokes) {
      if (!stroke?.points || stroke.points.length < 2) continue
      const pts = stroke.points.map(p => ({ x: p.x * canvas.width, y: p.y * canvas.height }))

      ctx.save()
      ctx.globalAlpha = stroke.opacity
      ctx.strokeStyle = stroke.tool === 'eraser' ? 'rgba(0,0,0,1)' : stroke.color
      ctx.lineWidth = stroke.width * Math.min(scaleX, scaleY)
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
      ctx.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1]
        const curr = pts[i]
        const mx = (prev.x + curr.x) / 2
        const my = (prev.y + curr.y) / 2
        ctx.quadraticCurveTo(prev.x, prev.y, mx, my)
      }
      ctx.stroke()
      ctx.restore()
    }
  }, [])

  // Fit canvas to displayed size
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ro = new ResizeObserver(() => {
      const { width, height } = canvas.getBoundingClientRect()
      canvas.width = width
      canvas.height = height
      redraw()
    })
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [redraw])

  // Read initial strokes
  useEffect(() => {
    const raw = localStorage.getItem(`eduflow-strokes-${lectureId}`)
    if (raw) {
      try { dataRef.current = JSON.parse(raw) } catch { /* ignore */ }
      redraw()
    }
  }, [lectureId, redraw])

  // Listen for stroke updates from lecturer tab
  useEffect(() => {
    const key = `eduflow-strokes-${lectureId}`
    function onStorage(e: StorageEvent) {
      if (e.key !== key) return
      if (e.newValue) {
        try { dataRef.current = JSON.parse(e.newValue) } catch { /* ignore */ }
      } else {
        dataRef.current = null
      }
      redraw()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [lectureId, redraw])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 10 }}
    />
  )
}
