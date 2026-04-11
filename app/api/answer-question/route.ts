import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface AnswerQuestionRequest {
  question: string
  lectureTitle: string
  chapterTitle?: string
  chapterSummary?: string
}

export interface AnswerQuestionResponse {
  answer: string
}

export async function POST(req: NextRequest) {
  try {
    const body: AnswerQuestionRequest = await req.json()
    const { question, lectureTitle, chapterTitle, chapterSummary } = body

    if (!question) return NextResponse.json({ error: 'No question provided' }, { status: 400 })

    const context = [
      `강의 제목: ${lectureTitle}`,
      chapterTitle ? `현재 챕터: ${chapterTitle}` : '',
      chapterSummary ? `챕터 요약: ${chapterSummary}` : '',
    ].filter(Boolean).join('\n')

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `당신은 온라인 강의를 진행 중인 강사를 돕는 AI 어시스턴트입니다. 수강생의 질문에 대해 명확하고 간결한 답변을 한국어로 작성하세요. 2-4문장 이내로 핵심만 답하세요.`,
        },
        {
          role: 'user',
          content: `${context}\n\n수강생 질문: ${question}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 300,
    })

    const answer = completion.choices[0].message.content?.trim() ?? ''
    return NextResponse.json({ answer })
  } catch (err) {
    console.error('[answer-question]', err)
    return NextResponse.json({ error: 'Failed to generate answer' }, { status: 500 })
  }
}
