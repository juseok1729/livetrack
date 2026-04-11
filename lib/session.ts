import { cookies } from 'next/headers'
import { getDb } from './db'

export const SESSION_COOKIE = 'livetrack_session'
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000
export const SESSION_MAX_AGE_SECONDS = SESSION_MAX_AGE_MS / 1000

export interface SessionUser {
  id: string
  email: string
  name: string
  role: 'lecturer' | 'student'
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  const db = getDb()
  const row = db.prepare(`
    SELECT u.id, u.email, u.name, u.role
    FROM sessions s JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > ?
  `).get(token, Date.now()) as SessionUser | undefined
  return row ?? null
}

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomUUID()
  const expiresAt = Date.now() + SESSION_MAX_AGE_MS
  getDb().prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?,?,?)').run(token, userId, expiresAt)
  return token
}

export function deleteSession(token: string) {
  getDb().prepare('DELETE FROM sessions WHERE token = ?').run(token)
}
