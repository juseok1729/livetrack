'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Heart, CheckCheck, MessageSquare, ChevronDown, Send, Sparkles, Trash2 } from 'lucide-react'
import type { Question } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'

interface QAPanelProps {
  questions: Question[]
  mode: 'lecturer' | 'student'
  onLike?: (id: string) => void
  onAnswer?: (id: string) => void
  onAnswerWithText?: (id: string, answer: string) => void
  onSubmit?: (content: string, name: string) => void
  onClearAll?: () => void
  lectureId?: string
  lectureTitle?: string
  currentChapterId?: string
  currentChapterTitle?: string
  currentChapterSummary?: string
  userName?: string
}

interface QuestionGroup {
  key: string
  content: string
  ids: string[]
  names: string[]
  members: Question[]
  totalLikes: number
  answered: boolean
  answer?: string
  representativeId: string
}

function buildGroupsFromQuestions(questions: Question[]): QuestionGroup[] {
  return questions.map(q => ({
    key: q.id,
    content: q.content.trim(),
    ids: [q.id],
    members: [q],
    names: [q.studentName],
    totalLikes: q.likes,
    answered: q.answered,
    answer: q.answer,
    representativeId: q.id,
  }))
}

function buildGroupsFromAI(
  apiGroups: { ids: string[]; representativeContent: string }[],
  questions: Question[]
): QuestionGroup[] {
  const byId = new Map(questions.map(q => [q.id, q]))
  return apiGroups.map(g => {
    const members = g.ids.map(id => byId.get(id)).filter(Boolean) as Question[]
    if (members.length === 0) return null
    const answered = members.some(q => q.answered)
    const answer = members.find(q => q.answer)?.answer
    return {
      key: members[0].id,
      content: g.representativeContent || members[0].content.trim(),
      ids: g.ids,
      members,
      names: [...new Set(members.map(q => q.studentName))],
      totalLikes: members.reduce((s, q) => s + q.likes, 0),
      answered,
      answer,
      representativeId: members[0].id,
    }
  }).filter(Boolean) as QuestionGroup[]
}

// ─── Student chat mode ───────────────────────────────────────────────────────

function ChatPanel({ questions, onLike, onSubmit, userName }: {
  questions: Question[]
  onLike?: (id: string) => void
  onSubmit?: (content: string, name: string) => void
  userName: string
}) {
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sort ascending by createdAt so newest is at bottom
  const sorted = [...questions].sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [questions.length])

  function send() {
    if (!text.trim()) return
    onSubmit?.(text.trim(), userName)
    setText('')
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {sorted.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <MessageSquare size={24} className="text-[#cccccc]" />
            <p className="text-xs text-[#aaaaaa]">첫 질문을 남겨보세요</p>
          </div>
        )}
        {sorted.map(q => {
          const isMe = q.studentName === userName
          const time = q.createdAt
            ? new Date(q.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
            : ''
          return (
            <div key={q.id} className={`flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
              {/* Name + time row */}
              <div className={`flex items-center gap-1.5 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                {!isMe && (
                  <div className="w-5 h-5 rounded-full bg-[#865FDF]/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-semibold text-[#865FDF]">{q.studentName[0]}</span>
                  </div>
                )}
                <span className="text-[10px] text-[#888888] font-medium">{q.studentName}</span>
                <span className="text-[10px] text-[#cccccc]">{time}</span>
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed break-words
                  ${isMe
                    ? 'bg-[#865FDF] text-white rounded-br-sm'
                    : 'bg-white border border-[#e5e5e5] text-[#111111] rounded-bl-sm'
                  }
                  ${q.answered ? 'opacity-70' : ''}
                `}
              >
                {q.content}
              </div>

              {/* Answered badge + like */}
              <div className={`flex items-center gap-2 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                {q.answered && (
                  <div className="flex items-center gap-0.5 text-[#22c55e]">
                    <CheckCheck size={11} />
                    {q.answer && (
                      <span className="text-[10px] text-[#555555] max-w-[160px] truncate">{q.answer}</span>
                    )}
                  </div>
                )}
                <button
                  onClick={() => onLike?.(q.id)}
                  className={`flex items-center gap-0.5 text-[10px] transition-colors
                    ${q.likedByMe ? 'text-[#ef4444]' : 'text-[#cccccc] hover:text-[#ef4444]'}`}
                >
                  <Heart size={11} fill={q.likedByMe ? 'currentColor' : 'none'} />
                  {q.likes > 0 && <span>{q.likes}</span>}
                </button>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-[#e5e5e5] px-3 py-3 flex items-center gap-2 bg-white">
        <input
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="질문을 입력하세요..."
          className="flex-1 px-3 py-2 text-sm border border-[#e5e5e5] rounded-xl outline-none focus:border-[#865FDF] focus:ring-2 focus:ring-[#865FDF]/10 transition placeholder:text-[#cccccc]"
        />
        <button
          onClick={send}
          disabled={!text.trim()}
          className="w-9 h-9 rounded-xl bg-[#865FDF] hover:bg-[#7450cc] disabled:opacity-40 flex items-center justify-center transition-colors flex-shrink-0"
        >
          <Send size={15} className="text-white" />
        </button>
      </div>
    </div>
  )
}

// ─── Lecturer card mode ───────────────────────────────────────────────────────

export function QAPanel({ questions, mode, onLike, onAnswer, onAnswerWithText, onSubmit, onClearAll, lectureTitle, currentChapterTitle, currentChapterSummary, userName }: QAPanelProps) {
  // Student mode → chat UI
  if (mode === 'student') {
    return (
      <ChatPanel
        questions={questions}
        onLike={onLike}
        onSubmit={onSubmit}
        userName={userName ?? '익명'}
      />
    )
  }

  // Lecturer mode → existing card UI
  return <LecturerQAPanel
    questions={questions}
    onLike={onLike}
    onAnswer={onAnswer}
    onAnswerWithText={onAnswerWithText}
    onClearAll={onClearAll}
    lectureTitle={lectureTitle}
    currentChapterTitle={currentChapterTitle}
    currentChapterSummary={currentChapterSummary}
  />
}

function LecturerQAPanel({ questions, onLike, onAnswer, onAnswerWithText, onClearAll, lectureTitle, currentChapterTitle, currentChapterSummary }: Omit<QAPanelProps, 'mode' | 'onSubmit' | 'lectureId' | 'currentChapterId' | 'userName'>) {
  const [showAnswered, setShowAnswered] = useState(false)
  const [sortMode, setSortMode] = useState<'popular' | 'recent'>('popular')
  const [aiGroups, setAiGroups] = useState<QuestionGroup[] | null>(null)
  const [grouping, setGrouping] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const unansweredQuestions = questions.filter(q => !q.answered)
  const unansweredKey = unansweredQuestions.map(q => q.id).join(',')
  const unansweredRef = useRef(unansweredQuestions)
  unansweredRef.current = unansweredQuestions

  const fetchGroups = useCallback(async (qs: Question[]) => {
    if (qs.length <= 1) {
      setAiGroups(buildGroupsFromQuestions(qs))
      return
    }
    setGrouping(true)
    try {
      const res = await fetch('/api/group-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: qs.map(q => ({ id: q.id, content: q.content })) }),
      })
      if (!res.ok) throw new Error('failed')
      const data = await res.json()
      setAiGroups(buildGroupsFromAI(data.groups ?? [], qs))
    } catch {
      setAiGroups(buildGroupsFromQuestions(qs))
    } finally {
      setGrouping(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchGroups(unansweredRef.current)
    }, 1000)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unansweredKey, fetchGroups])

  const answeredGroups = buildGroupsFromQuestions(questions.filter(q => q.answered))

  const unanswered = (aiGroups ?? buildGroupsFromQuestions(unansweredQuestions))
    .slice()
    .sort((a, b) => {
      if (sortMode === 'recent') {
        const aTime = Math.max(...a.members.map(m => new Date(m.createdAt || 0).getTime()))
        const bTime = Math.max(...b.members.map(m => new Date(m.createdAt || 0).getTime()))
        return bTime - aTime
      }
      return (b.ids.length + b.totalLikes) - (a.ids.length + a.totalLikes)
    })
  const answered = answeredGroups.sort((a, b) => b.totalLikes - a.totalLikes)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#e5e5e5] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-[#865FDF]" />
          <span className="text-sm font-semibold text-[#111111]">Q&A</span>
          {grouping && <Sparkles size={11} className="text-[#865FDF] animate-spin" />}
        </div>
        <div className="flex items-center gap-2">
          {unanswered.length > 0 && (
            <Badge variant="purple">{unanswered.length}개 대기중</Badge>
          )}
          {unanswered.length > 1 && (
            <button
              onClick={() => setSortMode(m => m === 'popular' ? 'recent' : 'popular')}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-[#e5e5e5] text-[#888888] hover:border-[#865FDF] hover:text-[#865FDF] transition-colors"
            >
              {sortMode === 'popular' ? '인기순' : '최신순'}
            </button>
          )}
          {questions.length > 0 && onClearAll && (
            <button
              onClick={() => { if (confirm('모든 질문을 삭제하시겠습니까?')) onClearAll() }}
              className="p-1.5 rounded-lg text-[#cccccc] hover:text-[#ef4444] hover:bg-red-50 transition-colors"
              title="질문 전체 삭제"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Questions list */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-2">
          {unanswered.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <MessageSquare size={24} className="text-[#cccccc]" />
              <p className="text-xs text-[#aaaaaa]">아직 질문이 없습니다</p>
            </div>
          )}
          {unanswered.map(g => (
            <GroupCard
              key={g.key}
              group={g}
              mode="lecturer"
              lectureTitle={lectureTitle}
              chapterTitle={currentChapterTitle}
              chapterSummary={currentChapterSummary}
              onLike={() => onLike?.(g.representativeId)}
              onAnswer={() => g.ids.forEach(id => onAnswer?.(id))}
              onAnswerWithText={(text) => g.ids.forEach(id => onAnswerWithText?.(id, text))}
            />
          ))}
        </div>

        {answered.length > 0 && (
          <div className="px-3 pb-3">
            <button
              onClick={() => setShowAnswered(!showAnswered)}
              className="flex items-center gap-1.5 text-xs text-[#aaaaaa] hover:text-[#555555] px-1 py-2 w-full transition-colors"
            >
              <ChevronDown size={13} className={`transition-transform ${showAnswered ? 'rotate-180' : ''}`} />
              답변 완료 {answered.length}개
            </button>
            {showAnswered && answered.map(g => (
              <GroupCard
                key={g.key}
                group={g}
                mode="lecturer"
                onLike={() => onLike?.(g.representativeId)}
                onAnswer={() => {}}
                onAnswerWithText={() => {}}
                lectureTitle={lectureTitle}
                chapterTitle={currentChapterTitle}
                chapterSummary={currentChapterSummary}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function GroupCard({ group: g, mode, onLike, onAnswer, onAnswerWithText, lectureTitle, chapterTitle, chapterSummary }: {
  group: QuestionGroup
  mode: 'lecturer' | 'student'
  onLike: () => void
  onAnswer: () => void
  onAnswerWithText: (text: string) => void
  lectureTitle?: string
  chapterTitle?: string
  chapterSummary?: string
}) {
  const [expanded, setExpanded] = useState(false)
  const [answerText, setAnswerText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const count = g.ids.length

  async function generateAiAnswer() {
    setAiLoading(true)
    try {
      const res = await fetch('/api/answer-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: g.content,
          lectureTitle: lectureTitle ?? '',
          chapterTitle,
          chapterSummary,
        }),
      })
      if (!res.ok) throw new Error('failed')
      const data = await res.json()
      setAnswerText(data.answer ?? '')
      setExpanded(true)
    } catch {
      setAnswerText('AI 답변 생성에 실패했습니다.')
    } finally {
      setAiLoading(false)
    }
  }

  function submitAnswer() {
    if (!answerText.trim()) { onAnswer(); return }
    onAnswerWithText(answerText.trim())
    setAnswerText('')
    setExpanded(false)
  }

  return (
    <div
      className={`rounded-xl border mb-2 transition-all animate-fade-in overflow-hidden
        ${g.answered ? 'border-[#e5e5e5] opacity-60' : 'border-[#e5e5e5] hover:border-[#865FDF]/40 cursor-pointer'}
      `}
      onClick={() => !g.answered && setExpanded(v => !v)}
    >
      <div className="p-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1">
            {g.names.slice(0, 3).map((name, i) => (
              <div
                key={name}
                title={name}
                className="w-5 h-5 rounded-full bg-[#865FDF]/10 flex items-center justify-center flex-shrink-0 border border-white"
                style={{ marginLeft: i > 0 ? '-6px' : 0, zIndex: g.names.length - i }}
              >
                <span className="text-[9px] font-semibold text-[#865FDF]">{name[0]}</span>
              </div>
            ))}
            {g.names.length > 3 && (
              <div className="w-5 h-5 rounded-full bg-[#f3f3f3] flex items-center justify-center border border-white" style={{ marginLeft: '-6px' }}>
                <span className="text-[9px] text-[#aaaaaa]">+{g.names.length - 3}</span>
              </div>
            )}
            <span className="text-xs text-[#aaaaaa] ml-1">
              {count > 1 ? `${count}명이 질문` : g.names[0]}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {count > 1 && !g.answered && (
              <span className="text-[10px] font-semibold text-[#865FDF] bg-[#f0ebff] px-1.5 py-0.5 rounded-full">×{count}</span>
            )}
            {g.answered && <CheckCheck size={13} className="text-[#22c55e]" />}
          </div>
        </div>

        <p className="text-sm text-[#111111] leading-relaxed mb-2">{g.content}</p>

        {g.answered && g.answer && (
          <div className="mt-1 mb-2 pl-3 border-l-2 border-[#865FDF]/30">
            <p className="text-xs text-[#555555] leading-relaxed">{g.answer}</p>
          </div>
        )}

        <div className="flex items-center justify-between" onClick={e => e.stopPropagation()}>
          <button
            onClick={onLike}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg text-[#aaaaaa] hover:bg-[#f3f3f3] hover:text-[#555555] transition-colors"
          >
            <Heart size={12} />
            {g.totalLikes > 0 ? g.totalLikes : ''}
          </button>
          {mode === 'lecturer' && !g.answered && (
            <div className="flex items-center gap-1">
              <button
                onClick={e => { e.stopPropagation(); generateAiAnswer() }}
                disabled={aiLoading}
                className="flex items-center gap-1 text-[10px] text-[#865FDF] bg-[#f0ebff] hover:bg-[#e8e0ff] px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
              >
                <Sparkles size={10} className={aiLoading ? 'animate-spin' : ''} />
                {aiLoading ? '생성 중...' : 'AI 답변'}
              </button>
              <span className="text-[10px] text-[#cccccc]">{expanded ? '▲' : '▼'}</span>
            </div>
          )}
        </div>
      </div>

      {expanded && g.members.length > 1 && (
        <div className="px-3 pb-2 border-t border-[#f3f3f3] pt-2" onClick={e => e.stopPropagation()}>
          <p className="text-[10px] font-semibold text-[#aaaaaa] uppercase tracking-wide mb-1.5">묶인 질문 ({g.members.length}개)</p>
          <div className="flex flex-col gap-1.5">
            {g.members.map(m => (
              <div key={m.id} className="flex items-start justify-between gap-2 py-1 border-b border-[#f8f8f8] last:border-0">
                <p className="text-xs text-[#333333] leading-snug flex-1">{m.content}</p>
                <span className="text-[10px] text-[#aaaaaa] flex-shrink-0 mt-0.5">{m.studentName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {mode === 'lecturer' && expanded && !g.answered && (
        <div className="px-3 pb-3 border-t border-[#f3f3f3] pt-2.5" onClick={e => e.stopPropagation()}>
          <Textarea
            placeholder="답변을 입력하세요 (비워두면 완료만 처리)..."
            value={answerText}
            onChange={e => setAnswerText(e.target.value)}
            rows={2}
            className="text-xs mb-2"
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) submitAnswer() }}
          />
          <div className="flex gap-2">
            <button
              onClick={submitAnswer}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[#865FDF] hover:bg-[#7450cc] text-white text-xs font-medium transition-colors"
            >
              <Send size={12} /> 답변 완료
            </button>
            <button
              onClick={() => setExpanded(false)}
              className="px-3 py-1.5 rounded-lg border border-[#e5e5e5] text-xs text-[#aaaaaa] hover:text-[#555555] transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
