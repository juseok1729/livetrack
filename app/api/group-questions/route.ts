import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export interface GroupQuestionsRequest {
  questions: { id: string; content: string }[]
}

export interface QuestionGroupResult {
  ids: string[]
  representativeContent: string
}

export interface GroupQuestionsResponse {
  groups: QuestionGroupResult[]
}

export async function POST(req: NextRequest) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  try {
    const { questions }: GroupQuestionsRequest = await req.json()

    if (!questions || questions.length === 0) {
      return NextResponse.json({ groups: [] })
    }

    const list = questions.map((q, i) => `[${i}] ${q.content}`).join('\n')

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `당신은 온라인 강의 채팅에서 수강생의 진짜 질문만 골라내어 그룹으로 묶는 분류기입니다.

[질문으로 인정하는 기준]
- 강의 내용, 개념, 과제, 기술 등에 대해 설명·확인·방법을 묻는 문장
- "왜", "어떻게", "무엇", "뭔가요", "어디서", "언제", "?", "가요?", "나요?", "까요?" 등 의문형
- 이해가 안 된다거나 헷갈린다는 표현을 포함한 문장

[질문이 아닌 것 — 반드시 제외]
- 단순 감탄사·동의·응답: 네, 아, 오, ㅎㅎ, 감사합니다, 알겠습니다 등
- 출석 체크·단순 존재 표시: 출석, 왔어요, 있습니다 등
- 강사 지시 따르기: 동그라미 그리기, 네 해볼게요 등
- 의미 없는 짧은 채팅 (3음절 이하 단순 반응)
- 칭찬·격려·잡담

같거나 매우 비슷한 주제의 질문들을 하나의 그룹으로 묶으세요. 완전히 다른 질문은 각자 별도 그룹입니다.`,
        },
        {
          role: 'user',
          content: `아래 메시지 목록에서 진짜 질문만 골라 그룹으로 묶고, JSON 형식으로만 응답하세요.
질문이 아닌 메시지는 완전히 무시하고 groups에 포함하지 마세요.
각 그룹에는 "indices" (0-based 인덱스 배열)와 "representative" (그룹을 대표하는 질문 요약, 20자 이내)를 포함하세요.

메시지 목록:
${list}

응답 형식:
{
  "groups": [
    { "indices": [0, 2], "representative": "..." },
    { "indices": [1], "representative": "..." }
  ]
}`,
        },
      ],
      temperature: 0,
      response_format: { type: 'json_object' },
    })

    const raw = JSON.parse(completion.choices[0].message.content ?? '{}')
    const groups: QuestionGroupResult[] = (raw.groups ?? []).map((g: { indices: number[]; representative: string }) => ({
      ids: (g.indices ?? []).map((i: number) => questions[i]?.id).filter(Boolean),
      representativeContent: g.representative ?? '',
    })).filter((g: QuestionGroupResult) => g.ids.length > 0)

    return NextResponse.json({ groups })
  } catch (err) {
    console.error('[group-questions]', err)
    return NextResponse.json({ groups: [] }, { status: 500 })
  }
}
