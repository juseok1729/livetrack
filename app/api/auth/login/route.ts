import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDb } from '@/lib/db'
import { createSession, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from '@/lib/session'

interface UserRow {
  id: string
  email: string
  password: string
  name: string
  role: 'lecturer' | 'student'
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    const db = getDb()
    const user = db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').get(email) as UserRow | undefined
    if (!user) return NextResponse.json({ error: '이메일 또는 비밀번호가 틀렸습니다.' }, { status: 401 })
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return NextResponse.json({ error: '이메일 또는 비밀번호가 틀렸습니다.' }, { status: 401 })
    const token = await createSession(user.id)
    const res = NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role })
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: '/',
    })
    return res
  } catch (err) {
    console.error('[login]', err)
    return NextResponse.json({ error: '오류가 발생했습니다.' }, { status: 500 })
  }
}
