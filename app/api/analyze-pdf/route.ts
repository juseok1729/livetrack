import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface AnalyzePdfRequest {
  pages: { pageNumber: number; text: string }[]
  fileName: string
}

export interface ChapterSuggestion {
  title: string
  slideRange: [number, number]
  summary: string
}

export interface AnalyzePdfResponse {
  title: string
  chapters: ChapterSuggestion[]
}

export async function POST(req: NextRequest) {
  try {
    const body: AnalyzePdfRequest = await req.json()
    const { pages, fileName } = body

    if (!pages || pages.length === 0) {
      return NextResponse.json({ error: 'No pages provided' }, { status: 400 })
    }

    // Build context: page number + first 300 chars of each page
    const pageContext = pages
      .map(p => `[슬라이드 ${p.pageNumber}]\n${p.text.slice(0, 300).trim()}`)
      .join('\n\n')

    const prompt = `다음은 강의 슬라이드 PDF에서 추출한 텍스트입니다. 슬라이드 수는 총 ${pages.length}장입니다.

${pageContext}

위 내용을 분석해서 아래 JSON 형식으로 응답해주세요:
1. 강의 제목(title): 전체 내용을 대표하는 한국어 제목
2. 챕터 목록(chapters): 슬라이드 흐름을 3~6개 챕터로 묶어주세요.
   - title: 챕터 제목 (한국어, 15자 이내)
   - slideRange: [시작슬라이드, 끝슬라이드] (1-based)
   - summary: 이 챕터에서 다루는 핵심 내용 한 줄 요약 (40자 이내)

반드시 유효한 JSON만 응답하고 다른 텍스트는 포함하지 마세요.
파일명 참고: ${fileName}

{
  "title": "...",
  "chapters": [
    { "title": "...", "slideRange": [1, 4], "summary": "..." },
    ...
  ]
}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0].message.content ?? '{}'
    const result: AnalyzePdfResponse = JSON.parse(content)

    // Validate structure
    if (!result.title || !Array.isArray(result.chapters)) {
      throw new Error('Invalid response structure')
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('[analyze-pdf]', err)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
