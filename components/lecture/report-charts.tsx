'use client'

import React, { useId } from 'react'

interface BarChartProps {
  data: { label: string; value: number; color?: string }[]
  maxValue?: number
  unit?: string
}

const BAR_AREA_H = 120

export function BarChart({ data, unit = '분' }: BarChartProps) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex gap-4 px-2">
      {data.map((d, i) => {
        const barH = Math.max(4, Math.round((d.value / max) * BAR_AREA_H))
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <span className="text-xs font-semibold text-[#555555]">{d.value}{unit}</span>
            <div className="w-full flex items-end" style={{ height: BAR_AREA_H }}>
              <div
                className="w-full rounded-t-lg transition-all duration-700"
                style={{
                  height: barH,
                  background: d.color ?? '#865FDF',
                  opacity: 0.6 + (i / Math.max(data.length - 1, 1)) * 0.4,
                }}
              />
            </div>
            <span className="text-[10px] text-[#aaaaaa] text-center leading-tight">{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}

interface LineChartProps {
  data: { x: number; y: number }[]
  color?: string
  width?: number
  height?: number
}

export function LineChart({ data, color = '#865FDF', width = 400, height = 120 }: LineChartProps) {
  const gradientId = useId()
  if (data.length < 2) return null

  const xs = data.map(d => d.x)
  const ys = data.map(d => d.y)
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)

  const px = (x: number) => ((x - minX) / (maxX - minX)) * (width - 20) + 10
  const py = (y: number) => height - 10 - ((y - minY) / (maxY - minY)) * (height - 20)

  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${px(d.x)} ${py(d.y)}`).join(' ')
  const area = `${path} L ${px(xs[xs.length - 1])} ${height} L ${px(xs[0])} ${height} Z`

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots at extremes */}
      {[data[0], data[data.length - 1]].map((d, i) => (
        <circle key={i} cx={px(d.x)} cy={py(d.y)} r="3" fill={color} />
      ))}
    </svg>
  )
}
