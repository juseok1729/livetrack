import type { Lecture, Question, ReportData } from './types'

export const MOCK_LECTURES: Lecture[] = [
  {
    id: 'lec-001',
    title: '마케팅 전략의 이해',
    code: 'MKT001',
    status: 'live',
    totalSlides: 24,
    description: '디지털 마케팅의 핵심 개념과 실전 전략을 다루는 강의',
    studentCount: 34,
    createdAt: '2026-04-10T09:00:00Z',
    session: {
      lectureId: 'lec-001',
      currentSlide: 8,
      currentChapterId: 'ch-002',
      startedAt: '2026-04-10T10:00:00Z',
      elapsedSeconds: 1847,
    },
    chapters: [
      { id: 'ch-001', title: '마케팅이란 무엇인가', slideRange: [1, 5], order: 1, status: 'completed', summary: '마케팅의 정의와 4P 프레임워크를 살펴보았습니다.', durationMinutes: 12 },
      { id: 'ch-002', title: '고객 세그멘테이션', slideRange: [6, 10], order: 2, status: 'active', summary: '고객을 세분화하는 방법론과 페르소나 설정 방법을 학습합니다.' },
      { id: 'ch-003', title: '디지털 마케팅 채널', slideRange: [11, 16], order: 3, status: 'pending' },
      { id: 'ch-004', title: 'SEO와 콘텐츠 전략', slideRange: [17, 20], order: 4, status: 'pending' },
      { id: 'ch-005', title: '성과 측정과 KPI', slideRange: [21, 24], order: 5, status: 'pending' },
    ],
  },
  {
    id: 'lec-002',
    title: 'Python 데이터 분석 입문',
    code: 'PYT002',
    status: 'preparing',
    totalSlides: 32,
    description: 'Pandas와 NumPy를 활용한 데이터 분석 기초 과정',
    studentCount: 0,
    createdAt: '2026-04-09T14:00:00Z',
    chapters: [
      { id: 'ch-101', title: 'Python 기초 복습', slideRange: [1, 6], order: 1, status: 'pending' },
      { id: 'ch-102', title: 'NumPy 배열 다루기', slideRange: [7, 14], order: 2, status: 'pending' },
      { id: 'ch-103', title: 'Pandas DataFrame', slideRange: [15, 22], order: 3, status: 'pending' },
      { id: 'ch-104', title: '데이터 시각화', slideRange: [23, 32], order: 4, status: 'pending' },
    ],
  },
  {
    id: 'lec-003',
    title: 'UX 리서치 방법론',
    code: 'UXR003',
    status: 'ended',
    totalSlides: 18,
    description: '사용자 인터뷰부터 유저빌리티 테스트까지',
    studentCount: 22,
    createdAt: '2026-04-08T09:00:00Z',
    session: {
      lectureId: 'lec-003',
      currentSlide: 18,
      currentChapterId: 'ch-203',
      startedAt: '2026-04-08T10:00:00Z',
      elapsedSeconds: 4500,
    },
    chapters: [
      { id: 'ch-201', title: 'UX 리서치 개요', slideRange: [1, 5], order: 1, status: 'completed', durationMinutes: 18 },
      { id: 'ch-202', title: '사용자 인터뷰 기법', slideRange: [6, 12], order: 2, status: 'completed', durationMinutes: 28 },
      { id: 'ch-203', title: '유저빌리티 테스트', slideRange: [13, 18], order: 3, status: 'completed', durationMinutes: 29 },
    ],
  },
]

export const MOCK_QUESTIONS: Question[] = [
  { id: 'q-001', lectureId: 'lec-001', chapterId: 'ch-002', studentName: '김민준', content: '고객 세그멘테이션과 타게팅의 차이가 무엇인가요?', likes: 12, answered: false, createdAt: '2026-04-10T10:23:00Z' },
  { id: 'q-002', lectureId: 'lec-001', chapterId: 'ch-002', studentName: '이서연', content: 'B2B와 B2C에서 세그멘테이션 기준이 다른가요?', likes: 8, answered: false, createdAt: '2026-04-10T10:25:00Z' },
  { id: 'q-003', lectureId: 'lec-001', chapterId: 'ch-001', studentName: '박지훈', content: '4P 중 Price가 가장 중요하다는 말이 있는데 맞나요?', likes: 5, answered: true, createdAt: '2026-04-10T10:15:00Z' },
  { id: 'q-004', lectureId: 'lec-001', chapterId: 'ch-002', studentName: '최예은', content: '페르소나는 몇 개까지 만드는 게 적당한가요?', likes: 7, answered: false, createdAt: '2026-04-10T10:28:00Z' },
  { id: 'q-005', lectureId: 'lec-001', chapterId: 'ch-002', studentName: '정현우', content: '실제 스타트업에서는 어떤 방식으로 세그멘테이션을 하나요?', likes: 3, answered: false, createdAt: '2026-04-10T10:30:00Z' },
  { id: 'q-006', lectureId: 'lec-001', chapterId: 'ch-001', studentName: '윤소희', content: '마케팅과 영업의 경계가 점점 흐려지고 있는데 어떻게 보시나요?', likes: 6, answered: true, createdAt: '2026-04-10T10:18:00Z' },
]

export const MOCK_REPORT: ReportData = {
  lectureId: 'lec-003',
  totalStudents: 22,
  totalQuestions: 18,
  chapterDurations: [
    { chapterId: 'ch-201', title: 'UX 리서치 개요', minutes: 18 },
    { chapterId: 'ch-202', title: '사용자 인터뷰 기법', minutes: 28 },
    { chapterId: 'ch-203', title: '유저빌리티 테스트', minutes: 29 },
  ],
  topQuestions: [
    { id: 'q-r01', lectureId: 'lec-003', chapterId: 'ch-202', studentName: '박수현', content: '인터뷰 참가자는 몇 명이 적당한가요?', likes: 14, answered: true, createdAt: '' },
    { id: 'q-r02', lectureId: 'lec-003', chapterId: 'ch-203', studentName: '김태양', content: '원격으로 유저빌리티 테스트를 진행하는 방법이 있나요?', likes: 11, answered: true, createdAt: '' },
    { id: 'q-r03', lectureId: 'lec-003', chapterId: 'ch-201', studentName: '이다은', content: '정성 리서치와 정량 리서치를 어떻게 조합하나요?', likes: 9, answered: false, createdAt: '' },
    { id: 'q-r04', lectureId: 'lec-003', chapterId: 'ch-202', studentName: '최준혁', content: '질문지를 어떻게 설계하면 좋을까요?', likes: 7, answered: true, createdAt: '' },
    { id: 'q-r05', lectureId: 'lec-003', chapterId: 'ch-203', studentName: '장미래', content: 'A/B 테스트와의 차이점이 궁금합니다', likes: 6, answered: false, createdAt: '' },
  ],
  engagementTimeline: Array.from({ length: 30 }, (_, i) => ({
    minute: i * 2.5,
    score: Math.max(30, Math.min(100, 85 - i * 0.5 + Math.sin(i * 0.8) * 15 + (i > 20 ? -15 : 0))),
  })),
  unansweredQuestions: [
    { id: 'q-r03', lectureId: 'lec-003', chapterId: 'ch-201', studentName: '이다은', content: '정성 리서치와 정량 리서치를 어떻게 조합하나요?', likes: 9, answered: false, createdAt: '' },
    { id: 'q-r05', lectureId: 'lec-003', chapterId: 'ch-203', studentName: '장미래', content: 'A/B 테스트와의 차이점이 궁금합니다', likes: 6, answered: false, createdAt: '' },
    { id: 'q-r06', lectureId: 'lec-003', chapterId: 'ch-203', studentName: '한동훈', content: '실제 서비스에 적용하는 프로세스가 궁금합니다', likes: 4, answered: false, createdAt: '' },
  ],
}

export const AI_CHAPTER_SUGGESTIONS = [
  { title: '강의 도입 및 목표 설정', slideRange: [1, 3] as [number, number] },
  { title: '핵심 개념 이해', slideRange: [4, 9] as [number, number] },
  { title: '사례 연구 분석', slideRange: [10, 15] as [number, number] },
  { title: '실전 적용 방법', slideRange: [16, 21] as [number, number] },
  { title: '정리 및 Q&A', slideRange: [22, 24] as [number, number] },
]

// Derive a suggested lecture title from the uploaded file name
export function suggestTitleFromFileName(fileName: string): string {
  // Strip extension
  const base = fileName.replace(/\.[^.]+$/, '')
  // Replace common separators with spaces
  const spaced = base.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim()

  // Heuristic: if the name already looks like Korean or meaningful text, use it directly
  if (/[가-힣]/.test(spaced)) return spaced

  // Map common English patterns → Korean suggestions
  const patterns: [RegExp, string][] = [
    [/python/i, 'Python 프로그래밍'],
    [/data.?anal/i, '데이터 분석 강의'],
    [/machine.?learn/i, '머신러닝 입문'],
    [/market/i, '마케팅 전략'],
    [/design/i, 'UX/UI 디자인 기초'],
    [/react|next|vue|angular/i, '프론트엔드 개발'],
    [/java(?!script)/i, 'Java 프로그래밍'],
    [/javascript|js/i, 'JavaScript 완전정복'],
    [/sql|database|db/i, '데이터베이스 기초'],
    [/finance|회계|accounting/i, '재무 관리 강의'],
    [/presentation|intro|overview/i, '강의 소개'],
  ]
  for (const [re, label] of patterns) {
    if (re.test(spaced)) return label
  }

  // Fallback: title-case the spaced name
  return spaced.replace(/\b\w/g, c => c.toUpperCase())
}

export function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
