# LiveTrack

실시간 온라인 강의를 위한 AI 보조 패널 — 챕터 구조 자동 생성, 실시간 Q&A 클러스터링, 수강생 흐름 복구를 하나의 화면에서 제공합니다.

---

## 개요

Zoom·Meet 등 기존 화상 강의는 채팅이 빠르게 밀려 질문이 누락되고, 수강생은 잠깐 집중이 흐트러지면 강의 흐름을 되찾기 어렵습니다. **LiveTrack**은 강의 자료(PDF/PPTX)를 업로드하면 AI가 챕터 구조를 자동 생성하고, 강의 중 수강생에게 실시간 진행 현황을 보여주며, 유사 질문을 AI로 묶어 강의자가 놓치지 않도록 정리합니다.

**핵심 가치:**
- **자동 챕터 생성**: OpenAI GPT-4o-mini가 슬라이드를 분석해 의미 있는 챕터 구조 제안
- **실시간 Q&A 관리**: 의미적으로 유사한 질문을 자동 그룹핑, 대표 질문으로 통합 표시
- **수강생 흐름 복구**: 현재 챕터 강조, 진행률 표시, 챕터별 AI 요약으로 집중력 유지
- **화면 공유 & 필기**: WHIP/WHEP 기반 저지연 스크린 쉐어링, 어노테이션 실시간 동기화
- **모바일 친화**: 수강생은 초대 링크 입장, 카메라 ON/OFF, 슬라이드 보기만으로 참여

---

## 기술 스택

| 분류 | 사용 기술 |
|------|-----------|
| **프레임워크** | Next.js 16.2.3 (App Router) |
| **언어** | TypeScript, React 19 |
| **UI** | Tailwind CSS v4, lucide-react (아이콘) |
| **AI** | OpenAI GPT-4o-mini (챕터 분석 · Q&A 그룹핑 · AI 요약) |
| **파일 렌더링** | pdfjs-dist (PDF), jszip + DOMParser (PPTX) |
| **화면 공유** | MediaMTX, WHIP/WHEP (WebRTC) |
| **상태 관리** | React Context + useReducer, localStorage |
| **데이터베이스** | SQLite (better-sqlite3) |
| **인증** | bcryptjs (비밀번호 해싱) |
| **실시간** | Server-Sent Events (SSE) |

---

## 주요 기능

### 강의자 기능

#### 1. 강의 준비 (Prepare)
- **PDF / PPTX 업로드** — 드래그 앤 드롭, 100MB 크기 검증
- **AI 챕터 자동 생성** — 슬라이드 텍스트를 분석해 의미 있는 챕터·요약 제안
  - 강의 제목 추천
  - 챕터별 슬라이드 범위 자동 설정
- **챕터 편집** — 인라인 이름 수정, 삭제, 드래그 순서 변경
- **초대 링크 발급** — 강의마다 고유 6자리 참여 코드 자동 생성

#### 2. 강의 진행 (Live)
- **슬라이드 내비게이션**
  - 이전/다음 버튼 클릭
  - 키보드 화살표 키 (←/→)
  - 좌측 챕터 썸네일 패널에서 직접 선택
- **화면 공유** (WHIP/MediaMTX)
  - 강의자 화면 → 수강생 실시간 전송
  - 저지연 WebRTC 기반
- **실시간 어노테이션**
  - 펜 도구 (검정색)
  - 형광펜 도구 (노랑색)
  - 수강생 화면에 실시간 동기화
- **Q&A 오버레이 패널**
  - 우측 엣지 호버 또는 토글 버튼으로 고정/해제
  - 3개 탭: 채팅(Chat), Q&A, 유저리스트
- **링크 복사** — 상단 바에서 초대 링크 즉시 복사 → 클립보드

#### 3. Q&A 관리
- **AI 질문 그룹핑** — 의미적 유사 질문을 GPT가 자동 묶음
- **그룹 펼치기** — 그룹 카드 클릭 → 개별 질문 목록
- **AI 답변 생성** — 현재 챕터 맥락 기반 초안 자동 생성
- **정렬 옵션** — 인기순(좋아요) / 최신순
- **답변 처리**
  - 제안된 답변 수정 및 저장
  - 또는 "완료" 체크만 가능
- **새 질문 토스트** — 새 질문 수신 시 화면 우측에 시각 알림
- **일괄 삭제** — "모두 지우기" 버튼으로 Q&A 초기화

---

### 수강생 기능

#### 1. 입장 흐름
- **회원가입 / 로그인** — 이메일·비밀번호 기반 인증
  - 강의자: 강의 관리 권한
  - 수강생: 강의 수강만 가능
- **초대 링크 접속** — `/student/join/[코드]` URL로 직접 입장
- **닉네임 + 카메라 로비**
  - 닉네임 입력 (기본값: 익명)
  - 카메라 ON/OFF 토글
  - 카메라 미리보기 (로비에서만)
- **대기 화면** — 강의 시작 대기
- **강의 종료 안내** — "강의가 종료되었습니다" 표시 후 대시보드 복귀

#### 2. 강의 수강
- **실시간 슬라이드 뷰**
  - 강의자 현재 슬라이드 실시간 표시
  - localStorage 및 서버 동기화
- **어노테이션 동기화**
  - 강의자 필기(펜/형광펜)가 슬라이드 위에 실시간 오버레이
- **챕터 현황 패널** (좌측 또는 탭)
  - 전체 챕터 목록
  - 현재 챕터 강조 표시
  - 진행률 바 및 경과 시간
- **챕터 요약**
  - 완료/진행 중 챕터 클릭 → AI 요약 팝오버
  - 챕터 전환 시 이전 챕터 핵심 내용 자동 표시
- **Q&A 질문 등록**
  - 닉네임 · 질문 입력
  - 좋아요(하트) 기능
- **화면 공유 보기** (WHEP/MediaMTX)
  - 강의자 화면 공유 ON ↔ 슬라이드 전환 가능
- **카메라 ON/OFF** — 실시간 스트림 제어
- **패널 토글** — 챕터/Q&A/유저리스트 패널 접기/펼치기
- **강의 나가기** — 언제든 강의 떠날 수 있음

#### 3. 실시간 사용자 목록
- **현재 참여자** — 강의 중인 수강생 목록
- **카메라 썸네일** — WHEP를 통한 수강생 카메라 실시간 프리뷰
- **온라인/오프라인** — 하트비트 기반 상태 표시

---

## 화면 구성

```
/                                  홈 화면 (랜딩 페이지)
  ├─ Gradient 배경, 기능 설명 카드
  └─ "강의 만들기" / "예정된 강의" 버튼

/auth/login                        로그인
/auth/signup                       회원가입
  └─ 이메일, 비밀번호, 역할 선택

/lecturer                          강의자 대시보드
  ├─ 진행 중 강의 (LIVE 배지)
  ├─ 준비 중 강의 (편집 가능)
  └─ 종료된 강의 (리포트 보기)

/lecturer/prepare/[id]             강의 준비
  ├─ 좌측: PDF/PPTX 업로드, AI 상태, 가이드
  └─ 우측: 챕터 편집 (드래그, 이름 수정, 삭제)

/lecturer/live/[id]                강의 진행 (강의자)
  ├─ 좌측: 챕터 썸네일 네비게이터
  ├─ 중앙: 슬라이드 뷰 + 어노테이션 캔버스
  └─ 우측: Q&A 패널 (Chat/Q&A/Users 탭)

/lecturer/report/[id]              강의 후 리포트
  └─ 통계, 질문 분석, 참여도 차트

/student/join/[code]               수강생 입장 및 강의 수강
  ├─ 로비: 닉네임, 카메라 선택
  └─ 강의: 슬라이드 + 챕터 + Q&A + 유저 목록
```

---

## 시작하기

### 요구사항
- Node.js 18+ (npm 또는 yarn)
- OpenAI API 키 (GPT-4o-mini 사용)
- (선택) MediaMTX 서버 또는 Docker

### 설치

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cat > .env.local << 'EOF'
OPENAI_API_KEY=sk-...
DATABASE_URL=sqlite:./data/livetrack.db
NEXT_PUBLIC_MEDIAMTX_URL=/api/mediamtx
EOF

# 개발 서버 실행
npm run dev
```

서버는 `http://localhost:3000`에서 실행됩니다.

### 빌드 및 프로덕션

```bash
# 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

### 환경 변수

#### 필수
- **OPENAI_API_KEY** — OpenAI API 키 (챕터 생성, Q&A 그룹핑, AI 답변)
- **DATABASE_URL** — SQLite 경로 (기본값: `sqlite:./data/livetrack.db`)

#### 선택
- **NEXT_PUBLIC_MEDIAMTX_URL** — MediaMTX 프록시 URL (기본값: `/api/mediamtx`)
  - 개발: `/api/mediamtx` (Next.js API 라우트)
  - 프로덕션: `https://your-domain.com/mediamtx` 또는 직접 서버 주소
- **NODE_ENV** — `development` 또는 `production`

> **참고**: AI 기능(챕터 분석, Q&A 그룹핑, AI 답변)은 OpenAI API 키가 필요합니다.
> API 키 없이도 파일 업로드·슬라이드 렌더링·Q&A 기본 기능은 동작합니다.

---

## Docker 배포

### docker-compose.yml 사용

```bash
# .env 파일에 설정
export OPENAI_API_KEY=sk-...
export MTX_WEBRTCADDITIONALHOSTS=<your_server_public_ip>  # (선택) 크로스 네트워크 ICE
export NEXT_PUBLIC_MEDIAMTX_URL=https://your-domain.com/mediamtx

# 빌드 및 실행
docker-compose up -d
```

서비스는 다음 포트에서 실행됩니다:
- **LiveTrack**: `http://localhost:3888`
- **MediaMTX**: UDP/TCP `8189` (WebRTC ICE 미디어)

### Dockerfile 구성

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### 네트워크 설정

docker-compose는 외부 네트워크 `webservice`를 사용합니다:

```bash
# 필요시 먼저 생성
docker network create webservice
```

---

## 아키텍처 개요

### 데이터 흐름

#### 1. 강의 준비 (Prepare)
```
[강의자] PDF/PPTX 업로드
    ↓
[클라이언트] pdfjs-dist / jszip로 슬라이드 추출
    ↓
[서버] /api/analyze-pdf → OpenAI GPT-4o-mini
    ↓
[클라이언트] 챕터 제안 표시 & 편집
    ↓
[저장] 강의 상태 (chapters, totalSlides) 업데이트
```

#### 2. 강의 진행 (Live)
```
[강의자] 슬라이드 네비게이션 + 어노테이션
    ↓
[localStorage] eduflow-slide-{lectureId} (JPEG 동기화)
    ↓
[수강생 폴링] /api/lectures/{id} 주기적 확인
    ↓
[수강생] 슬라이드 + 어노테이션 실시간 렌더링
```

#### 3. Q&A 관리
```
[수강생] 질문 등록 → /api/lectures/{id}/questions (POST)
    ↓
[강의자 폴링] /api/lectures/{id}/questions (3초 주기)
    ↓
[강의자] 새 질문 토스트 표시
    ↓
[선택] /api/group-questions 호출 → GPT 그룹핑
    ↓
[강의자] 그룹화된 질문 표시 & 답변 작성
```

### 핵심 라이브러리

#### PDF 렌더링 (`lib/pdf-parser.ts`)
- **pdfjs-dist**: 브라우저 내 PDF 파싱
- **cMapUrl** & **standardFontDataUrl**: 한글 폰트 지원
- 페이지별 텍스트 추출 + 캔버스 렌더링 → JPEG 변환

#### PPTX 렌더링 (`lib/pptx-renderer.ts`)
- **jszip**: PPTX 압축 해제 (XML 파싱)
- **DOMParser**: 슬라이드 XML 분석
- 도형(grpSp), 표, 테두리 등 캔버스 렌더링

#### 슬라이드 저장소 (`lib/slide-store.ts`)
- 메모리 Map: 현재 강의 슬라이드 이미지 캐시
- IndexedDB: 페이지 새로고침 시 복구 (용량 제한 우회)

#### 사용자 온라인 상태 (`lib/presence-registry.ts`)
- 하트비트 기반 온라인 추적
- 수강생 입장/퇴장 감지

#### 카메라 스트림 (`lib/camera-registry.ts`)
- WHEP 스트림 경로 등록/해제
- 수강생 카메라 썸네일 조회

### 상태 관리

#### Lecture Context (`contexts/lecture-context.tsx`)
- **전역 상태**: lectures[], questions[]
- **액션**: ADD_LECTURE, UPDATE_CHAPTERS, START_LECTURE, ADVANCE_SLIDE, etc.
- **localStorage 동기화**: 탭 간 브라우드캐스트

#### Auth Context (`contexts/auth-context.tsx`)
- **현재 사용자**: user (id, name, role)
- **로그인/로그아웃**: localStorage 기반
- **역할 기반 라우팅**: /lecturer vs /student

### 실시간 기술

#### Server-Sent Events (SSE)
- 새 질문 알림
- 강의 상태 변경 (LIVE ↔ 종료)

#### localStorage + storage 이벤트
- 같은 브라우저 탭 간 슬라이드 동기화
- localStorage 키 변경 감지 → 즉시 업데이트

#### WebRTC (WHIP/WHEP via MediaMTX)
- **WHIP**: 강의자 화면 공유 업로드
- **WHEP**: 수강생 카메라 + 강의자 화면 공유 다운로드
- 저지연, P2P 가능

---

## 주요 컴포넌트

### 페이지
| 파일 | 역할 |
|------|------|
| `app/page.tsx` | 홈 화면 (랜딩, 기능 카드) |
| `app/auth/login/page.tsx` | 로그인 |
| `app/auth/signup/page.tsx` | 회원가입 |
| `app/lecturer/page.tsx` | 강의자 대시보드 |
| `app/lecturer/prepare/[id]/page.tsx` | 강의 준비 (업로드, 챕터 편집) |
| `app/lecturer/live/[id]/page.tsx` | 강의 진행 (강의자) |
| `app/student/join/[code]/page.tsx` | 수강생 입장 및 수강 |

### 주요 컴포넌트
| 파일 | 역할 |
|------|------|
| `components/lecture/chapter-editor.tsx` | 챕터 편집 UI (드래그, 이름 수정) |
| `components/lecture/chapter-panel.tsx` | 챕터 현황 패널 (수강생) |
| `components/lecture/qa-panel.tsx` | Q&A 패널 (Chat, Q&A, Users 탭) |
| `components/lecture/file-upload-zone.tsx` | 파일 업로드 영역 |
| `components/lecture/slide-annotator.tsx` | 실시간 필기 도구 (펜, 형광펜) |
| `components/lecture/stroke-overlay.tsx` | 필기 렌더링 (수강생) |
| `components/lecture/screen-share-publisher.tsx` | 강의자 화면 공유 WHIP |
| `components/lecture/screen-share-viewer.tsx` | 화면 공유 보기 WHEP |
| `components/lecture/student-cam-publisher.tsx` | 수강생 카메라 WHIP |
| `components/lecture/student-cam-viewer.tsx` | 수강생 카메라 썸네일 WHEP |
| `components/lecture/ai-summary-card.tsx` | AI 챕터 요약 팝오버 |

### 유틸리티
| 파일 | 역할 |
|------|------|
| `lib/pdf-parser.ts` | PDF 페이지 추출 및 텍스트 추출 |
| `lib/pptx-renderer.ts` | PPTX 파싱 및 슬라이드 렌더링 |
| `lib/slide-store.ts` | 슬라이드 메모리 + IndexedDB 캐시 |
| `lib/presence-registry.ts` | 사용자 온라인 상태 추적 |
| `lib/camera-registry.ts` | WHEP 카메라 스트림 관리 |
| `lib/types.ts` | 공유 타입 정의 |

---

## API 라우트

### 강의 관리
- `GET /api/lectures` — 모든 강의 조회
- `POST /api/lectures` — 강의 생성
- `GET /api/lectures/[id]` — 강의 상세 조회
- `PATCH /api/lectures/[id]` — 강의 상태 업데이트 (슬라이드, 어노테이션)
- `GET /api/lectures/by-code/[code]` — 참여 코드로 강의 조회

### 슬라이드
- `GET /api/lectures/[id]/slides` — 슬라이드 이미지 조회
- `POST /api/lectures/[id]/slides` — 슬라이드 저장

### Q&A
- `GET /api/lectures/[id]/questions` — 질문 목록 조회
- `POST /api/lectures/[id]/questions` — 질문 생성
- `PATCH /api/lectures/[id]/questions/[qid]` — 질문 업데이트 (답변, 좋아요)
- `POST /api/group-questions` — AI 질문 그룹핑

### AI 분석
- `POST /api/analyze-pdf` — PDF 텍스트 → 챕터 생성 (OpenAI)

### 실시간
- `GET /api/lectures/[id]/student-count` — 현재 수강생 수

---

## 개발 팁

### 로컬 테스트

#### 두 브라우저 탭에서 테스트
```bash
# 터미널 1: 개발 서버
npm run dev

# 터미널 2: 강의자 로그인 (admin@livetrack.com)
# 브라우저 탭 1: http://localhost:3000 → "강의 만들기" → 준비 → 시작

# 브라우저 탭 2: 수강생 입장
# http://localhost:3000/student/join/[코드]
```

#### localStorage 디버깅
```javascript
// 브라우저 콘솔
localStorage.getItem('livetrack_qa_panel')  // Q&A 패널 상태
localStorage.getItem('livetrack_nickname')  // 닉네임
localStorage.getItem('eduflow-slide-[id]')  // 현재 슬라이드 이미지
localStorage.getItem('eduflow-strokes-[id]') // 어노테이션 스트로크
```

### AI 기능 비활성화
OpenAI API 키가 없으면 다음 기능은 건너뜁니다:
- 챕터 자동 생성 (수동 입력 필요)
- Q&A 그룹핑 (개별 질문으로 표시)
- AI 요약 (팝오버 미표시)

### MediaMTX 로컬 테스트
```bash
# docker-compose로 MediaMTX만 실행
docker-compose up mediamtx

# 다른 터미널에서 Next.js 실행
npm run dev

# 강의자: 화면 공유 ON
# 수강생: 화면 공유 보기 가능
```

---

## 배포 체크리스트

### 프로덕션 설정
- [ ] `.env.local` → `.env.production` (환경 변수 설정)
- [ ] `OPENAI_API_KEY` 설정
- [ ] `DATABASE_URL` 지정 (SQLite 경로)
- [ ] `NEXT_PUBLIC_MEDIAMTX_URL` 설정 (HTTPS)
- [ ] MediaMTX 공개 IP 설정 (`MTX_WEBRTCADDITIONALHOSTS`)

### 데이터베이스
- [ ] SQLite 데이터 디렉토리 생성 및 권한 설정
- [ ] 정기 백업 계획

### 보안
- [ ] HTTPS 설정 (nginx/Cloudflare 프록시)
- [ ] CORS 설정 확인
- [ ] 비밀번호 해싱 검증 (bcryptjs)

### 모니터링
- [ ] 서버 로그 모니터링 (docker logs)
- [ ] 디스크 사용량 확인 (슬라이드 이미지)
- [ ] API 응답 시간 추적

---

## 알려진 제한사항

1. **인증**: localStorage 기반 — 프로덕션에서는 NextAuth.js 또는 Supabase로 교체 권장
2. **실시간 DB 없음**: 강의자 ↔ 수강생 동기화는 localStorage + 서버 폴링에 의존
3. **슬라이드 용량**: 100MB 제한 (PPTX/PDF 합계)
4. **브라우저 지원**: Chrome/Edge (최신) — Safari/Firefox 호환성 미완성
5. **화면 공유**: MediaMTX 의존 — 자체 WebRTC 시그널링 필요

---

## 라이센스

MIT License

---

## 문제 해결

### Q: "강의가 로드되지 않습니다"
- [ ] 브라우저 개발자 도구 → Network 탭 확인
- [ ] `/api/lectures/[id]` 요청 상태 확인
- [ ] 로그인 상태 확인 (쿠키/localStorage)

### Q: "AI 챕터 생성이 안 됩니다"
- [ ] `OPENAI_API_KEY` 설정 확인
- [ ] OpenAI API 할당량 확인
- [ ] 콘솔 에러 메시지 확인

### Q: "화면 공유가 연결되지 않습니다"
- [ ] MediaMTX 실행 확인: `docker ps | grep mediamtx`
- [ ] 방화벽 포트 `8189` 열림 확인
- [ ] `NEXT_PUBLIC_MEDIAMTX_URL` 올바른지 확인

### Q: "수강생이 슬라이드를 못 봅니다"
- [ ] 강의자가 PDF를 업로드했는지 확인
- [ ] 브라우저 콘솔: `localStorage.getItem('eduflow-slide-[id]')` 확인
- [ ] 슬라이드 이미지 로드 실패 여부 확인 (Network 탭)

---

## 기여 및 피드백

이 프로젝트는 교육용으로 설계되었습니다. 개선 사항이나 기능 요청은 이슈 또는 PR로 제출해주세요.

