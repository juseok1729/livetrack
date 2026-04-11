'use client'

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react'
import type { Lecture, Question, Chapter } from '@/lib/types'

interface LectureState {
  lectures: Lecture[]
  questions: Question[]
  currentLectureId: string | null
  showAiSummary: boolean
  aiSummaryText: string
  aiSummaryChapter: string
  loaded: boolean
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
  | { type: 'UNLIKE_QUESTION'; questionId: string }
  | { type: 'ANSWER_QUESTION'; questionId: string }
  | { type: 'ANSWER_QUESTION_WITH_TEXT'; questionId: string; answer: string }
  | { type: 'CLEAR_QUESTIONS'; lectureId: string }
  | { type: 'SHOW_SUMMARY'; text: string; chapter: string }
  | { type: 'HIDE_SUMMARY' }
  | { type: 'START_LECTURE'; lectureId: string }
  | { type: 'END_LECTURE'; lectureId: string }
  | { type: '_SYNC_LECTURES'; lectures: Lecture[] }
  | { type: '_SYNC_QUESTIONS'; lectureId: string; questions: Question[] }
  | { type: '_SYNC_LECTURE'; lecture: Lecture }
  | { type: '_SET_LOADED' }

const initialState: LectureState = {
  lectures: [],
  questions: [],
  currentLectureId: null,
  showAiSummary: false,
  aiSummaryText: '',
  aiSummaryChapter: '',
  loaded: false,
}

function reducer(state: LectureState, action: LectureAction): LectureState {
  switch (action.type) {
    case 'SET_CURRENT':
      return { ...state, currentLectureId: action.id }
    case '_SET_LOADED':
      return { ...state, loaded: true }

    case 'ADD_LECTURE':
      return { ...state, lectures: [action.lecture, ...state.lectures] }

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
            ? { ...q, likes: q.likedByMe ? q.likes : q.likes + 1, likedByMe: true }
            : q
        ),
      }

    case 'UNLIKE_QUESTION':
      return {
        ...state,
        questions: state.questions.map(q =>
          q.id === action.questionId
            ? { ...q, likes: Math.max(0, q.likedByMe ? q.likes - 1 : q.likes), likedByMe: false }
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

    case '_SYNC_LECTURES':
      return { ...state, lectures: action.lectures }

    case '_SYNC_QUESTIONS':
      return {
        ...state,
        questions: [
          ...state.questions.filter(q => q.lectureId !== action.lectureId),
          ...action.questions,
        ],
      }

    case '_SYNC_LECTURE':
      return {
        ...state,
        lectures: state.lectures.map(l => l.id === action.lecture.id ? action.lecture : l),
      }

    default:
      return state
  }
}

interface LectureContextValue {
  state: LectureState
  dispatch: (action: LectureAction) => void
  currentLecture: Lecture | null
  lectureQuestions: (lectureId: string) => Question[]
}

const LectureContext = createContext<LectureContextValue | null>(null)

export function LectureProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatchRaw] = useReducer(reducer, initialState)
  const stateRef = useRef(state)
  stateRef.current = state

  // Load initial lectures (lecturer mode)
  useEffect(() => {
    fetch('/api/lectures')
      .then(r => r.ok ? r.json() : [])
      .then((lectures: Lecture[]) => {
        dispatchRaw({ type: '_SYNC_LECTURES', lectures })
        dispatchRaw({ type: '_SET_LOADED' })
      })
      .catch(() => dispatchRaw({ type: '_SET_LOADED' }))
  }, [])

  // Middleware: dispatch + API sync
  const dispatch = useCallback((action: LectureAction) => {
    dispatchRaw(action)

    // Fire API side effects (don't await — optimistic UI)
    const apiSync = async () => {
      switch (action.type) {
        case 'ADD_LECTURE':
          await fetch('/api/lectures', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: action.lecture.id, title: action.lecture.title, code: action.lecture.code }),
          }).catch(console.error)
          break

        case 'UPDATE_TITLE':
          await fetch(`/api/lectures/${action.lectureId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: action.title }),
          }).catch(console.error)
          break

        case 'UPDATE_TOTAL_SLIDES':
          await fetch(`/api/lectures/${action.lectureId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ totalSlides: action.totalSlides }),
          }).catch(console.error)
          break

        case 'UPDATE_CHAPTERS':
          await fetch(`/api/lectures/${action.lectureId}/chapters`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chapters: action.chapters }),
          }).catch(console.error)
          break

        case 'START_LECTURE': {
          const lec = stateRef.current.lectures.find(l => l.id === action.lectureId)
          const startedAt = new Date().toISOString()
          const firstChapterId = lec?.chapters[0]?.id ?? ''
          if (lec?.chapters.length) {
            const updatedChapters = lec.chapters.map((c, i) => ({ ...c, status: i === 0 ? 'active' as const : 'pending' as const }))
            await fetch(`/api/lectures/${action.lectureId}/chapters`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chapters: updatedChapters }),
            }).catch(console.error)
          }
          await fetch(`/api/lectures/${action.lectureId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'live', startedAt, currentSlide: 1, currentChapterId: firstChapterId }),
          }).catch(console.error)
          break
        }

        case 'END_LECTURE':
          await fetch(`/api/lectures/${action.lectureId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'ended' }),
          }).catch(console.error)
          break

        case 'ADVANCE_SLIDE':
        case 'PREV_SLIDE': {
          // stateRef is already updated because we update it synchronously above
          setTimeout(async () => {
            const lec = stateRef.current.lectures.find(l => l.id === action.lectureId)
            if (!lec?.session) return
            await fetch(`/api/lectures/${action.lectureId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ currentSlide: lec.session.currentSlide, currentChapterId: lec.session.currentChapterId }),
            }).catch(console.error)
          }, 0)
          break
        }

        case 'ADD_QUESTION':
          await fetch(`/api/lectures/${action.question.lectureId}/questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action.question),
          }).catch(console.error)
          break

        case 'LIKE_QUESTION':
          await fetch(`/api/questions/${action.questionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'like' }),
          }).catch(console.error)
          break

        case 'UNLIKE_QUESTION':
          await fetch(`/api/questions/${action.questionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'unlike' }),
          }).catch(console.error)
          break

        case 'ANSWER_QUESTION':
          await fetch(`/api/questions/${action.questionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'answer' }),
          }).catch(console.error)
          break

        case 'ANSWER_QUESTION_WITH_TEXT':
          await fetch(`/api/questions/${action.questionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'answer_with_text', answer: action.answer }),
          }).catch(console.error)
          break

        case 'CLEAR_QUESTIONS': {
          await fetch(`/api/lectures/${action.lectureId}/questions`, {
            method: 'DELETE',
          }).catch(console.error)
          break
        }
      }
    }
    apiSync()
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
