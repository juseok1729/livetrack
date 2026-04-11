import Link from 'next/link'
import { GraduationCap, Sparkles, BarChart3, MessageSquare, BookOpen, ArrowRight, CheckCircle } from 'lucide-react'

const features = [
  { icon: Sparkles, title: 'AI 챕터 자동 생성', desc: 'PPT/PDF를 업로드하면 AI가 자동으로 챕터를 제안합니다' },
  { icon: BookOpen, title: '실시간 챕터 패널', desc: '수강생이 항상 강의 어디쯤 있는지 한눈에 볼 수 있습니다' },
  { icon: MessageSquare, title: '구조화된 Q&A', desc: '좋아요 기반 질문 정렬로 중요한 질문을 놓치지 않습니다' },
  { icon: BarChart3, title: '강의 후 리포트', desc: '챕터별 진행 시간과 집중도 변화를 자동으로 정리합니다' },
]

const benefits = [
  '강의 준비 시간 50% 단축',
  '수강생 맥락 이탈 최소화',
  '중요 질문 유실 방지',
  '다음 강의 개선 피드백',
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-[#1e1e1e]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#865FDF] flex items-center justify-center">
            <GraduationCap size={16} className="text-white" />
          </div>
          <span className="font-semibold text-lg tracking-tight">EduFlow</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/lecturer" className="text-sm text-[#a0a0a0] hover:text-white transition-colors px-4 py-2">
            강의자로 시작
          </Link>
          <Link
            href="/student/join/MKT001"
            className="flex items-center gap-2 bg-[#865FDF] hover:bg-[#7450cc] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            수강생으로 참여
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-8 pt-24 pb-20">
        <div className="inline-flex items-center gap-2 bg-[#865FDF]/10 border border-[#865FDF]/20 rounded-full px-4 py-1.5 mb-8">
          <Sparkles size={12} className="text-[#865FDF]" />
          <span className="text-xs text-[#c4aff5]">AI 기반 강의 관리 플랫폼</span>
        </div>
        <h1 className="text-5xl font-bold leading-tight max-w-2xl mb-6">
          온라인 강의의{' '}
          <span className="text-[#865FDF]">맥락을 연결</span>하세요
        </h1>
        <p className="text-[#a0a0a0] text-lg max-w-xl leading-relaxed mb-10">
          강의자와 수강생 사이의 인지 단절을 AI로 해결합니다.
          챕터 자동 생성부터 실시간 Q&A, 강의 후 리포트까지.
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="/lecturer"
            className="flex items-center gap-2 bg-[#865FDF] hover:bg-[#7450cc] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            강의 만들기 <ArrowRight size={16} />
          </Link>
          <Link
            href="/student/join/MKT001"
            className="flex items-center gap-2 border border-[#2a2a2a] hover:border-[#865FDF] text-white font-medium px-6 py-3 rounded-xl transition-colors"
          >
            수강생으로 체험
          </Link>
        </div>
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 mt-10">
          {benefits.map(b => (
            <div key={b} className="flex items-center gap-1.5 text-sm text-[#555555]">
              <CheckCircle size={13} className="text-[#865FDF]" />
              {b}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-8 pb-24">
        <div className="max-w-4xl mx-auto grid grid-cols-2 gap-5">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-6 border border-[#1e1e1e] rounded-2xl bg-[#0f0f0f] hover:border-[#865FDF]/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[#865FDF]/10 flex items-center justify-center mb-4">
                <Icon size={18} className="text-[#865FDF]" />
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-sm text-[#555555] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA personas */}
      <section className="px-8 pb-24">
        <div className="max-w-4xl mx-auto grid grid-cols-2 gap-5">
          <div className="p-8 rounded-2xl bg-[#865FDF] text-white">
            <p className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-3">강의자 (Lecturer)</p>
            <h3 className="text-xl font-bold mb-3">준비부터 리포트까지</h3>
            <p className="text-sm opacity-80 leading-relaxed mb-6">PPT를 올리면 AI가 챕터를 만들고, 강의 중엔 Q&A를 정리하며, 끝나면 리포트를 드립니다.</p>
            <Link href="/lecturer" className="inline-flex items-center gap-2 bg-white text-[#865FDF] font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-[#f0ebff] transition-colors">
              강의자 대시보드 <ArrowRight size={14} />
            </Link>
          </div>
          <div className="p-8 rounded-2xl bg-[#1a1a1a] text-white border border-[#2a2a2a]">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#555555] mb-3">수강생 (Student)</p>
            <h3 className="text-xl font-bold mb-3">맥락을 잃지 않는 강의</h3>
            <p className="text-sm text-[#a0a0a0] leading-relaxed mb-6">챕터 패널이 지금 어디에 있는지 알려주고, 질문은 흘러가지 않고 기록됩니다.</p>
            <Link href="/student/join/MKT001" className="inline-flex items-center gap-2 bg-[#865FDF] text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-[#7450cc] transition-colors">
              강의 참여하기 <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
