import { NextRequest, NextResponse } from 'next/server'
import { registerCamera, unregisterCamera, getActiveCameras } from '@/lib/camera-registry'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return NextResponse.json({ cameras: getActiveCameras(id) })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { nickname, streamPath } = await req.json()
  registerCamera(id, nickname, streamPath)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { nickname } = await req.json()
  unregisterCamera(id, nickname)
  return NextResponse.json({ ok: true })
}
