import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const db = getDb()

  if (body.action === 'like') {
    db.prepare('UPDATE questions SET likes = likes + 1 WHERE id = ?').run(id)
  } else if (body.action === 'unlike') {
    db.prepare('UPDATE questions SET likes = MAX(0, likes - 1) WHERE id = ?').run(id)
  } else if (body.action === 'answer') {
    db.prepare('UPDATE questions SET answered = CASE WHEN answered=1 THEN 0 ELSE 1 END WHERE id = ?').run(id)
  } else if (body.action === 'answer_with_text') {
    db.prepare('UPDATE questions SET answered = 1, answer = ? WHERE id = ?').run(body.answer, id)
  }
  return NextResponse.json({ ok: true })
}
