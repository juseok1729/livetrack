import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  hover?: boolean
}

export function Card({ children, className = '', onClick, hover }: CardProps) {
  return (
    <div
      className={`bg-white border border-[#e5e5e5] rounded-xl ${hover ? 'hover:border-[#865FDF] hover:shadow-sm cursor-pointer transition-all' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
