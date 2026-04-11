'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'lecturer' | 'student'
}

interface StoredUser extends AuthUser {
  password: string
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => { ok: boolean; error?: string }
  signup: (email: string, password: string, name: string, role: 'lecturer' | 'student') => { ok: boolean; error?: string }
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const USERS_KEY = 'eduflow_users'
const CURRENT_KEY = 'eduflow_current_user'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CURRENT_KEY)
      if (raw) setUser(JSON.parse(raw))
    } catch {}
    setLoading(false)
  }, [])

  const login = useCallback((email: string, password: string): { ok: boolean; error?: string } => {
    try {
      const users: StoredUser[] = JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]')
      const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password)
      if (!found) return { ok: false, error: '이메일 또는 비밀번호가 틀렸습니다.' }
      const { password: _pw, ...authUser } = found
      setUser(authUser)
      localStorage.setItem(CURRENT_KEY, JSON.stringify(authUser))
      return { ok: true }
    } catch {
      return { ok: false, error: '오류가 발생했습니다.' }
    }
  }, [])

  const signup = useCallback((email: string, password: string, name: string, role: 'lecturer' | 'student'): { ok: boolean; error?: string } => {
    try {
      const users: StoredUser[] = JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]')
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase()))
        return { ok: false, error: '이미 사용 중인 이메일입니다.' }
      const newUser: StoredUser = { id: `user-${Date.now()}`, email, password, name, role }
      localStorage.setItem(USERS_KEY, JSON.stringify([...users, newUser]))
      return { ok: true }
    } catch {
      return { ok: false, error: '오류가 발생했습니다.' }
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(CURRENT_KEY)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
