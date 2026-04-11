'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signup } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [role, setRole] = useState<'lecturer' | 'student'>('student')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const redirect = searchParams.get('redirect') ?? ''

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('비밀번호는 6자 이상이어야 합니다.'); return }
    setSubmitting(true)
    const result = signup(email.trim(), password, name.trim(), role)
    setSubmitting(false)
    if (!result.ok) { setError(result.error ?? ''); return }
    router.push(`/auth/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`)
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-9 h-9 rounded-xl bg-[#865FDF] flex items-center justify-center">
            <BookOpen size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-[#111111]">Livetrack</span>
        </div>

        <div className="bg-white rounded-2xl border border-[#e5e5e5] shadow-sm p-8">
          <h1 className="text-xl font-bold text-[#111111] mb-1">회원가입</h1>
          <p className="text-sm text-[#888888] mb-6">계정을 만들어 시작하세요</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Role selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#555555]">역할</label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: 'lecturer', label: '강의자', desc: '강의를 진행합니다' },
                  { value: 'student', label: '수강생', desc: '강의를 수강합니다' },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRole(opt.value)}
                    className={`flex flex-col items-start px-3.5 py-3 rounded-xl border text-left transition-all
                      ${role === opt.value
                        ? 'border-[#865FDF] bg-[#f0ebff] text-[#865FDF]'
                        : 'border-[#e5e5e5] text-[#555555] hover:border-[#cccccc]'
                      }`}
                  >
                    <span className="text-sm font-semibold">{opt.label}</span>
                    <span className="text-[11px] opacity-70 mt-0.5">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#555555]">이름</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="홍길동"
                required
                className="w-full px-3.5 py-2.5 text-sm border border-[#e5e5e5] rounded-xl outline-none focus:border-[#865FDF] focus:ring-2 focus:ring-[#865FDF]/10 transition placeholder:text-[#cccccc]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#555555]">이메일</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full px-3.5 py-2.5 text-sm border border-[#e5e5e5] rounded-xl outline-none focus:border-[#865FDF] focus:ring-2 focus:ring-[#865FDF]/10 transition placeholder:text-[#cccccc]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#555555]">비밀번호 <span className="font-normal text-[#aaaaaa]">(6자 이상)</span></label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="비밀번호 입력"
                  required
                  className="w-full px-3.5 py-2.5 pr-10 text-sm border border-[#e5e5e5] rounded-xl outline-none focus:border-[#865FDF] focus:ring-2 focus:ring-[#865FDF]/10 transition placeholder:text-[#cccccc]"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaaaaa] hover:text-[#555555]"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-[#ef4444] bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-[#865FDF] hover:bg-[#7450cc] text-white text-sm font-semibold transition-colors disabled:opacity-60 mt-1"
            >
              {submitting ? '처리 중...' : '계정 만들기'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#888888] mt-5">
          이미 계정이 있으신가요?{' '}
          <Link href={`/auth/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="text-[#865FDF] font-medium hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  )
}
