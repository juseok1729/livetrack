'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, BookOpen, BarChart3, Settings, GraduationCap, Plus
} from 'lucide-react'
import { useLecture } from '@/contexts/lecture-context'

const navItems = [
  { href: '/lecturer', icon: LayoutDashboard, label: '대시보드' },
  { href: '/lecturer/prepare/lec-002', icon: BookOpen, label: '강의 준비' },
  { href: '/lecturer/report/lec-003', icon: BarChart3, label: '리포트' },
  { href: '#', icon: Settings, label: '설정' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { state } = useLecture()
  const liveLecture = state.lectures.find(l => l.status === 'live')

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-[#0a0a0a] flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 pt-6 pb-4 border-b border-[#2a2a2a]">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#865FDF] flex items-center justify-center flex-shrink-0">
            <GraduationCap size={16} className="text-white" />
          </div>
          <span className="text-white font-semibold text-base tracking-tight">LiveTrack</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pt-4 sidebar-scroll overflow-y-auto">
        <div className="mb-6">
          <Link
            href="/lecturer"
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg bg-[#865FDF] text-white text-sm font-medium mb-4 hover:bg-[#7450cc] transition-colors"
          >
            <Plus size={15} />
            새 강의 만들기
          </Link>

          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#555555] px-3 mb-2">메뉴</p>

          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== '/lecturer' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-colors ${
                  active
                    ? 'bg-[#1e1e1e] text-white'
                    : 'text-[#a0a0a0] hover:text-white hover:bg-[#1a1a1a]'
                }`}
              >
                <Icon size={16} strokeWidth={active ? 2 : 1.5} />
                {label}
              </Link>
            )
          })}
        </div>

        {/* Live badge — only shown when a lecture is actually live */}
        {liveLecture && (
          <div className="px-3 py-3 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
              <span className="text-xs text-[#a0a0a0]">현재 강의 중</span>
            </div>
            <p className="text-white text-sm font-medium leading-tight truncate">{liveLecture.title}</p>
            <Link
              href={`/lecturer/live/${liveLecture.id}`}
              className="mt-2 block text-center text-xs text-[#865FDF] hover:text-[#c4aff5] transition-colors"
            >
              강의실 입장 →
            </Link>
          </div>
        )}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-[#2a2a2a]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#865FDF] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-semibold">김</span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">김강사</p>
            <p className="text-[#555555] text-xs truncate">강의자</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
