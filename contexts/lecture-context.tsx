'use client'

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react'
import type { Lecture, Question, Chapter } from '@/lib/types'
import { MOCK_LECTURES, MOCK_QUESTIONS } from '@/lib/mock-data'

const STORAGE_KEY = 'eduflow_state_v1'

// Only the parts that need to sync across tabs
interface PersistedState {
  lectures: Lecture[]
  questions: Question[]
}

function loadFromStorage(): Partial<PersistedState> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveToStorage(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

interface LectureState {
  lectures: Lecture[]
  questions: Question[]
  currentLectureId: string | null
  showAiSummary: boolean
  aiSummaryText: string
  aiSummaryChapter: string
}

type LectureAction =
  | { type: 'SET_CURRENT'; id: string | null }
  | { type: 'ADD_LECTURE'; lecture: Lecture }
  | { type: 'UPDATE_TOTAL_SLIDES'; lectureId: string; totalSlides: number }
  | { type: 'ADVANCE_SLIDE'; lectureId: string }
  | { type: 'PREV_SLIDE'; lectureId: string }
  | { type: 'UPDATE_CHAPTERS'; lectureId: string; chapters: Chapter[] }
  | { type: 'UPDATE_TITLE'; lectureId: string; title: string }
  | { type: 'ADD_QUESTION'; question: Question }
  | { type: 'LIKE_QUESTION'; questionId: string }
  | { type: 'ANSWER_QUESTION'; questionId: string }
  | { type: 'ANSWER_QUESTION_WITH_TEXT'; questionId: string; answer: string }
  | { type: 'CLEAR_QUESTIONS'; lectureId: string }
  | { type: 'SHOW_SUMMARY'; text: string; chapter: string }
  | { type: 'HIDE_SUMMARY' }
  | { type: 'START_LECTURE'; lectureId: string }
  | { type: 'END_LECTURE'; lectureId: string }
  | { type: '_SYNC'; lectures: Lecture[]; questions: Question[] }

const initialState: LectureState = {
  lectures: MOCK_LECTURES,
  questions: MOCK_QUESTIONS,
  currentLectureId: null,
  showAiSummary: false,
  aiSummaryText: '',
  aiSummaryChapter: '',
}

function reducer(state: LectureState, action: LectureAction): LectureState {
  switch (action.type) {
    case 'SET_CURRENT':
      return { ...state, currentLectureId: action.id }

    case 'ADD_LECTURE':
      return { ...state, lectures: [...state.lectures, action.lecture] }

    case 'UPDATE_TOTAL_SLIDES':
      return {
        ...state,
        lectures: state.lectures.map(l =>
          l.id === action.lectureId ? { ...l, totalSlides: action.totalSlides } : l
        ),
      }

    case 'ADVANCE_SLIDE': {
      return {
        ...state,
        lectures: state.lectures.map(lec => {
          if (lec.id !== action.lectureId || !lec.session) return lec
          const next = Math.min(lec.totalSlides, lec.session.currentSlide + 1)
          const chapter = lec.chapters.find(c => next >= c.slideRange[0] && next <= c.slideRange[1])
          const newChapterId = chapter?.id ?? lec.session.currentChapterId
          const chapterChanged = newChapterId !== lec.session.currentChapterId
          const updatedChapters = chapterChanged
            ? lec.chapters.map(c => ({
                ...c,
                status: (c.id === newChapterId ? 'active' : c.order < (chapter?.order ?? 0) ? 'completed' : 'pending') as Chapter['status'],
              }))
            : lec.chapters
          return { ...lec, chapters: updatedChapters, session: { ...lec.session, currentSlide: next, currentChapterId: newChapterId } }
        }),
      }
    }

    case 'PREV_SLIDE': {
      return {
        ...state,
        lectures: state.lectures.map(lec => {
          if (lec.id !== action.lectureId || !lec.session) return lec
          const prev = Math.max(1, lec.session.currentSlide - 1)
          const chapter = lec.chapters.find(c => prev >= c.slideRange[0] && prev <= c.slideRange[1])
          const newChapterId = chapter?.id ?? lec.session.currentChapterId
          return { ...lec, session: { ...lec.session, currentSlide: prev, currentChapterId: newChapterId } }
        }),
      }
    }

    case 'UPDATE_CHAPTERS':
      return {
        ...state,
        lectures: state.lectures.map(lec =>
          lec.id === action.lectureId ? { ...lec, chapters: action.chapters } : lec
        ),
      }

    case 'UPDATE_TITLE':
      return {
        ...state,
        lectures: state.lectures.map(lec =>
          lec.id === action.lectureId ? { ...lec, title: action.title } : lec
        ),
      }

    case 'ADD_QUESTION':
      return { ...state, questions: [action.question, ...state.questions] }

    case 'LIKE_QUESTION':
      return {
        ...state,
        questions: state.questions.map(q =>
          q.id === action.questionId
            ? { ...q, likes: q.likedByMe ? q.likes - 1 : q.likes + 1, likedByMe: !q.likedByMe }
            : q
        ),
      }

    case 'ANSWER_QUESTION':
      return {
        ...state,
        questions: state.questions.map(q =>
          q.id === action.questionId ? { ...q, answered: !q.answered } : q
        ),
      }

    case 'ANSWER_QUESTION_WITH_TEXT':
      return {
        ...state,
        questions: state.questions.map(q =>
          q.id === action.questionId ? { ...q, answered: true, answer: action.answer } : q
        ),
      }

    case 'CLEAR_QUESTIONS':
      return { ...state, questions: state.questions.filter(q => q.lectureId !== action.lectureId) }

    case 'SHOW_SUMMARY':
      return { ...state, showAiSummary: true, aiSummaryText: action.text, aiSummaryChapter: action.chapter }

    case 'HIDE_SUMMARY':
      return { ...state, showAiSummary: false }

    case 'START_LECTURE': {
      const lec = state.lectures.find(l => l.id === action.lectureId)
      if (!lec) return state
      return {
        ...state,
        lectures: state.lectures.map(l =>
          l.id === action.lectureId
            ? {
                ...l,
                status: 'live',
                session: {
                  lectureId: action.lectureId,
                  currentSlide: 1,
                  currentChapterId: l.chapters[0]?.id ?? '',
                  startedAt: new Date().toISOString(),
                  elapsedSeconds: 0,
                },
                chapters: l.chapters.map((c, i) => ({ ...c, status: i === 0 ? 'active' : 'pending' })),
              }
            : l
        ),
      }
    }

    case 'END_LECTURE':
      return {
        ...state,
        lectures: state.lectures.map(l =>
          l.id === action.lectureId ? { ...l, status: 'ended' } : l
        ),
      }

    case '_SYNC':
      return { ...state, lectures: action.lectures, questions: action.questions }

    default:
      return state
  }
}

interface LectureContextValue {
  state: LectureState
  dispatch: React.Dispatch<LectureAction>
  currentLecture: Lecture | null
  lectureQuestions: (lectureId: string) => Question[]
}

const LectureContext = createContext<LectureContextValue | null>(null)

export function LectureProvider({ children }: { children: React.ReactNode }) {
  // Always start with initialState on server — hydrate from localStorage after mount
  const [state, dispatch] = useReducer(reducer, initialState)
  const isExternalUpdate = useRef(false)
  const hydrated = useRef(false)

  // Hydrate once on client mount
  useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true
    const saved = loadFromStorage()
    if (saved.lectures || saved.questions) {
      isExternalUpdate.current = true
      dispatch({
        type: '_SYNC',
        lectures: saved.lectures ?? initialState.lectures,
        questions: saved.questions ?? initialState.questions,
      })
    }
  }, [])

  // Persist to localStorage on every state change (client only)
  useEffect(() => {
    if (!hydrated.current) return
    if (isExternalUpdate.current) {
      isExternalUpdate.current = false
      return
    }
    saveToStorage({ lectures: state.lectures, questions: state.questions })
  }, [state.lectures, state.questions])

  // Listen for changes from other tabs (student ↔ lecturer sync)
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY || !e.newValue) return
      try {
        const incoming: PersistedState = JSON.parse(e.newValue)
        isExternalUpdate.current = true
        dispatch({ type: '_SYNC', lectures: incoming.lectures, questions: incoming.questions } as never)
      } catch {}
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const currentLecture = state.lectures.find(l => l.id === state.currentLectureId) ?? null

  const lectureQuestions = useCallback(
    (lectureId: string) => state.questions.filter(q => q.lectureId === lectureId),
    [state.questions]
  )

  return (
    <LectureContext.Provider value={{ state, dispatch, currentLecture, lectureQuestions }}>
      {children}
    </LectureContext.Provider>
  )
}

export function useLecture() {
  const ctx = useContext(LectureContext)
  if (!ctx) throw new Error('useLecture must be used within LectureProvider')
  return ctx
}
