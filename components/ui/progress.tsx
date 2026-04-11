import React from 'react'

interface ProgressProps {
  value: number // 0-100
  className?: string
  color?: string
  height?: number
  showLabel?: boolean
}

export function Progress({ value, className = '', color = '#865FDF', height = 4, showLabel }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 rounded-full overflow-hidden" style={{ height, background: '#e5e5e5' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${clamped}%`, background: color }}
        />
      </div>
      {showLabel && <span className="text-xs text-[#555555] w-8 text-right">{Math.round(clamped)}%</span>}
    </div>
  )
}
