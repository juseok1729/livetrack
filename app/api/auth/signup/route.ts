import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDb } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, role } = await req.json()
    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: '모든 항목을 입력하세요.' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: '비밀번호는 6자 이상이어야 합니다.' }, { status: 400 })
    }
    const db = getDb()
    const existing = db.prepare('SELECT id FROM users WHERE email = ? COLLATE NOCASE').get(email)
    if (existing) return NextResponse.json({ error: '이미 사용 중인 이메일입니다.' }, { status: 409 })
    const hashed = await bcrypt.hash(password, 10)
    const id = `user-${crypto.randomUUID()}`
    db.prepare('INSERT INTO users (id, email, password, name, role) VALUES (?,?,?,?,?)').run(id, email.toLowerCase(), hashed, name, role)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[signup]', err)
    return NextResponse.json({ error: '오류가 발생했습니다.' }, { status: 500 })
  }
}
