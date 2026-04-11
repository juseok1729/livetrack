import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

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
  try {
    const { questions }: GroupQuestionsRequest = await req.json()

    if (!questions || questions.length === 0) {
      return NextResponse.json({ groups: [] })
    }

    if (questions.length === 1) {
      return NextResponse.json({
        groups: [{ ids: [questions[0].id], representativeContent: questions[0].content }],
      })
    }

    const list = questions.map((q, i) => `[${i}] ${q.content}`).join('\n')

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `당신은 수강생 질문들을 의미적 유사성으로 묶는 분류기입니다. 같거나 매우 비슷한 주제를 묻는 질문들을 하나의 그룹으로 묶으세요. 완전히 다른 질문은 각자 별도 그룹입니다.`,
        },
        {
          role: 'user',
          content: `다음 질문들을 의미적 유사성에 따라 그룹으로 묶고, 아래 JSON 형식으로만 응답하세요.
각 그룹에는 "indices" (0-based 인덱스 배열)와 "representative" (그룹을 대표하는 질문 요약, 20자 이내)를 포함하세요.

질문 목록:
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
