'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Clock, Users, MessageSquare, CheckCheck, AlertCircle } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart, LineChart } from '@/components/lecture/report-charts'
import { useLecture } from '@/contexts/lecture-context'
import { MOCK_REPORT } from '@/lib/mock-data'

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { state } = useLecture()
  const lecture = state.lectures.find(l => l.id === id)
  const report = MOCK_REPORT // use mock for ended lecture

  if (!lecture) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-[#aaaaaa]">강의를 찾을 수 없습니다</p>
        </div>
      </AppLayout>
    )
  }

  const totalMinutes = report.chapterDurations.reduce((s, c) => s + c.minutes, 0)
  const answeredCount = report.topQuestions.filter(q => q.answered).length

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/lecturer" className="p-2 rounded-lg hover:bg-[#f3f3f3] text-[#555555] transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-[#111111]">{lecture.title}</h1>
            <Badge variant="gray">강의 리포트</Badge>
          </div>
          <p className="text-sm text-[#555555]">강의 종료 후 자동 생성된 분석 리포트입니다</p>
        </div>
        <button className="flex items-center gap-2 border border-[#e5e5e5] hover:border-[#865FDF] text-[#555555] hover:text-[#865FDF] text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
          <Download size={15} /> PDF 내보내기
        </button>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { icon: Clock, label: '총 강의 시간', value: `${totalMinutes}분`, color: '#865FDF' },
          { icon: Users, label: '참여 수강생', value: `${report.totalStudents}명`, color: '#3b82f6' },
          { icon: MessageSquare, label: '총 질문 수', value: `${report.totalQuestions}개`, color: '#f59e0b' },
          { icon: CheckCheck, label: '답변 완료', value: `${answeredCount}/${report.topQuestions.length}`, color: '#22c55e' },
        ].map(({ icon: Icon, label, value, color }) => (
          <Card key={label} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[#aaaaaa]">{label}</span>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
                <Icon size={14} style={{ color }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#111111]">{value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Left col */}
        <div className="col-span-3 flex flex-col gap-6">
          {/* Chapter durations */}
          <Card className="p-6">
            <h2 className="text-sm font-semibold text-[#111111] mb-1">챕터별 진행 시간</h2>
            <p className="text-xs text-[#aaaaaa] mb-5">각 챕터에 소요된 시간 분포</p>
            <BarChart
              data={report.chapterDurations.map(c => ({ label: c.title, value: c.minutes }))}
              unit="분"
            />
          </Card>

          {/* Engagement timeline */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-[#111111]">수강생 집중도 변화</h2>
              <Badge variant="purple">AI 추정</Badge>
            </div>
            <p className="text-xs text-[#aaaaaa] mb-5">강의 진행 시간에 따른 집중도 흐름</p>
            <LineChart
              data={report.engagementTimeline.map(d => ({ x: d.minute, y: d.score }))}
              color="#865FDF"
              height={100}
            />
            <div className="flex justify-between mt-2">
              <span className="text-[10px] text-[#aaaaaa]">강의 시작</span>
              <span className="text-[10px] text-[#aaaaaa]">강의 종료</span>
            </div>
          </Card>

          {/* Unanswered */}
          {report.unansweredQuestions.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle size={15} className="text-[#f59e0b]" />
                <h2 className="text-sm font-semibold text-[#111111]">미답변 질문</h2>
                <Badge variant="yellow">{report.unansweredQuestions.length}개</Badge>
              </div>
              <p className="text-xs text-[#aaaaaa] mb-4">수강생에게 이메일로 답변을 보내보세요</p>
              <div className="flex flex-col gap-2">
                {report.unansweredQuestions.map(q => (
                  <div key={q.id} className="flex items-start gap-3 p-3 bg-[#fffbf0] border border-[#f59e0b]/20 rounded-xl">
                    <AlertCircle size={14} className="text-[#f59e0b] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-[#111111]">{q.content}</p>
                      <p className="text-xs text-[#aaaaaa] mt-1">{q.studentName} · 좋아요 {q.likes}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right col */}
        <div className="col-span-2 flex flex-col gap-6">
          {/* Top questions */}
          <Card className="p-6">
            <h2 className="text-sm font-semibold text-[#111111] mb-1">인기 질문 TOP 5</h2>
            <p className="text-xs text-[#aaaaaa] mb-4">좋아요 수 기준 상위 질문</p>
            <div className="flex flex-col gap-2">
              {report.topQuestions.map((q, i) => (
                <div key={q.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#f8f8f8] transition-colors">
                  <span className="text-xs font-bold text-[#865FDF] w-4 flex-shrink-0 mt-0.5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#111111] leading-relaxed">{q.content}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-[#aaaaaa]">{q.studentName}</span>
                      <span className="text-[10px] text-[#aaaaaa]">· 좋아요 {q.likes}</span>
                      {q.answered && <Badge variant="green">답변 완료</Badge>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Chapter summary */}
          <Card className="p-6">
            <h2 className="text-sm font-semibold text-[#111111] mb-4">챕터 요약</h2>
            <div className="flex flex-col gap-2">
              {lecture.chapters.map((ch, i) => (
                <div key={ch.id} className="flex items-center gap-3 py-2 border-b border-[#f3f3f3] last:border-0">
                  <span className="text-[10px] font-bold text-[#cccccc] w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#111111] truncate">{ch.title}</p>
                    <p className="text-[10px] text-[#aaaaaa]">슬라이드 {ch.slideRange[0]}–{ch.slideRange[1]}장</p>
                  </div>
                  {ch.durationMinutes && (
                    <span className="text-xs text-[#aaaaaa] flex-shrink-0">{ch.durationMinutes}분</span>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Next lecture tips */}
          <Card className="p-6 bg-gradient-to-br from-[#f0ebff] to-white border-[#865FDF]/20">
            <h2 className="text-sm font-semibold text-[#865FDF] mb-3">다음 강의 개선 포인트</h2>
            <ul className="flex flex-col gap-2 text-xs text-[#555555]">
              <li className="flex items-start gap-2"><span className="text-[#865FDF] font-bold mt-0.5">1.</span>강의 후반부 집중도가 낮아졌습니다. 중간 환기 활동을 추가해보세요.</li>
              <li className="flex items-start gap-2"><span className="text-[#865FDF] font-bold mt-0.5">2.</span>미답변 질문 3개를 다음 강의 시작 전에 답변해주세요.</li>
              <li className="flex items-start gap-2"><span className="text-[#865FDF] font-bold mt-0.5">3.</span>챕터 2에서 질문이 집중되었습니다. 관련 보충 자료를 준비하세요.</li>
            </ul>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
