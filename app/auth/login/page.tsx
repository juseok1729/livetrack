'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading, login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const redirect = searchParams.get('redirect') ?? ''

  useEffect(() => {
    if (!loading && user) {
      const needsLecturer = redirect.startsWith('/lecturer')
      // Only auto-redirect if the user already has the right role for the destination
      if (!needsLecturer || user.role === 'lecturer') {
        router.replace(redirect || '/')
      }
      // Otherwise fall through and show the form so they can log in with the correct account
    }
  }, [user, loading, router, redirect])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const result = await login(email.trim(), password)
    setSubmitting(false)
    if (!result.ok) { setError(result.error ?? ''); return }
    const role = result.user?.role
    router.push(redirect || '/')
  }

  if (loading) return null

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
          <h1 className="text-xl font-bold text-[#111111] mb-1">로그인</h1>
          <p className="text-sm text-[#888888] mb-4">계속하려면 로그인하세요</p>
          {user && redirect.startsWith('/lecturer') && user.role !== 'lecturer' && (
            <div className="mb-4 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
              <strong>{user.name}</strong>님은 수강생 계정입니다. 강의자 계정으로 로그인하세요.
            </div>
          )}

          {/* Quick admin login for reviewers */}
          <button
            type="button"
            onClick={async () => {
              setEmail('admin@livetrack.com')
              setPassword('kkkkkk')
              setError('')
              setSubmitting(true)
              const result = await login('admin@livetrack.com', 'kkkkkk')
              setSubmitting(false)
              if (!result.ok) { setError(result.error ?? ''); return }
              router.push(redirect || '/')
            }}
            className="w-full py-2.5 rounded-xl bg-[#f5f2ff] hover:bg-[#ede8ff] border border-[#865FDF]/30 text-[#865FDF] text-sm font-semibold transition-colors mb-4 flex items-center justify-center gap-2"
          >
            <span className="text-base">🔑</span>
            <span>관리자 계정으로 빠른 로그인</span>
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-[#e5e5e5]" />
            <span className="text-xs text-[#aaaaaa]">또는</span>
            <div className="flex-1 h-px bg-[#e5e5e5]" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              <label className="text-xs font-medium text-[#555555]">비밀번호</label>
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
              {submitting ? '로그인 중...' : '로그인'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#888888] mt-5">
          계정이 없으신가요?{' '}
          <Link href={`/auth/signup${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="text-[#865FDF] font-medium hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
