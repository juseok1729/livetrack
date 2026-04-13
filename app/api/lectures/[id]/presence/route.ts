import { NextRequest, NextResponse } from 'next/server'
import { registerPresence, unregisterPresence, getPresence } from '@/lib/presence-registry'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return NextResponse.json({ participants: getPresence(id) })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { nickname } = await req.json()
  registerPresence(id, nickname)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { nickname } = await req.json()
  unregisterPresence(id, nickname)
  return NextResponse.json({ ok: true })
}
