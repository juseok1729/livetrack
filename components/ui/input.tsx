import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-[#111111]">{label}</label>}
      <input
        className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors placeholder:text-[#aaaaaa]
          border-[#e5e5e5] focus:border-[#865FDF] focus:ring-2 focus:ring-[#865FDF]/10
          ${error ? 'border-[#ef4444]' : ''}
          ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-[#ef4444]">{error}</span>}
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export function Textarea({ label, className = '', ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-[#111111]">{label}</label>}
      <textarea
        className={`w-full px-3 py-2 text-sm border border-[#e5e5e5] rounded-lg outline-none resize-none transition-colors placeholder:text-[#aaaaaa]
          focus:border-[#865FDF] focus:ring-2 focus:ring-[#865FDF]/10 ${className}`}
        {...props}
      />
    </div>
  )
}
