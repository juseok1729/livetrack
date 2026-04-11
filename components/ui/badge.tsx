import React from 'react'

type BadgeVariant = 'purple' | 'green' | 'yellow' | 'red' | 'gray' | 'dark'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  purple: 'bg-[#f0ebff] text-[#865FDF]',
  green:  'bg-green-50 text-green-700',
  yellow: 'bg-yellow-50 text-yellow-700',
  red:    'bg-red-50 text-red-600',
  gray:   'bg-[#f3f3f3] text-[#555555]',
  dark:   'bg-[#2a2a2a] text-white',
}

export function Badge({ variant = 'gray', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
